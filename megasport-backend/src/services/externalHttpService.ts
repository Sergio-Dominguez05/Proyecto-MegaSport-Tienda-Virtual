import { XMLParser } from 'fast-xml-parser'
import { HttpError } from '../utils/httpError.js'

export type ExternalFormat = 'JSON' | 'XML'

function endpointUrl(host: string, script: string): URL {
    const base = /^https?:\/\//i.test(host) ? host : `http://${host}`
    const normalizedBase = base.endsWith('/') ? base : `${base}/`
    const normalizedScript = script.replace(/^\/+/, '')

    try {
        const baseUrl = new URL(normalizedBase)
        const url = new URL(normalizedScript, baseUrl)
        if (!['http:','https:'].includes(url.protocol) || url.origin !== baseUrl.origin || url.username || url.password)
            throw new Error('Dirección no permitida')
        return url
    } catch {
        throw new HttpError(500, 'La configuración del servicio externo no contiene una dirección válida')
    }
}

function looksLikeHtml(body: string, contentType: string | null): boolean {
    if (contentType?.toLowerCase().includes('text/html')) return true
    return /^\s*<!doctype\s+html|^\s*<html[\s>]/i.test(body)
}

function parseXml(body: string): Record<string, unknown> {
    const parsed = new XMLParser({ ignoreAttributes: false, parseTagValue: false }).parse(body) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('XML inválido')
    const record = parsed as Record<string, unknown>
    const firstValue = Object.entries(record).find(([key]) => !key.startsWith('?'))?.[1]
    return typeof firstValue === 'object' && firstValue !== null && !Array.isArray(firstValue)
        ? firstValue as Record<string, unknown>
        : record
}

function parseJson(body: string): Record<string, unknown> {
    const parsed: unknown = JSON.parse(body)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('JSON inválido')
    return parsed as Record<string, unknown>
}

function parseExternalBody(
    body: string,
    preferredFormat: ExternalFormat,
    contentType: string | null,
): Record<string, unknown> {
    if (!body.trim() || looksLikeHtml(body, contentType)) throw new Error('El servicio devolvió HTML o una respuesta vacía')

    const type = contentType?.toLowerCase() ?? ''
    const trimmed = body.trim()
    const probablyXml = type.includes('xml') || trimmed.startsWith('<')
    const probablyJson = type.includes('json') || trimmed.startsWith('{')

    // Be tolerant when the peer ignores ?formato= and answers in the other supported format.
    const parsers = probablyXml
        ? [parseXml]
        : probablyJson
            ? [parseJson]
            : preferredFormat === 'XML'
                ? [parseXml]
                : [parseJson]

    for (const parser of parsers) {
        try { return parser(body) }
        catch { /* try the other supported representation */ }
    }
    throw new Error('La respuesta no contiene JSON ni XML válido')
}

function candidateScripts(script: string): string[] {
    const scripts = [script]
    if (!/\.[a-z0-9]+$/i.test(script)) scripts.push(`${script}.php`)
    return scripts
}

export async function callExternalService(
    host: string,
    script: string,
    query: Record<string, string>,
    format: ExternalFormat,
): Promise<Record<string, unknown>> {
    const timeout = Number(process.env.EXTERNAL_SERVICE_TIMEOUT_MS) || 5000
    const scripts = candidateScripts(script)
    let lastError: HttpError | null = null

    for (let index = 0; index < scripts.length; index++) {
        const candidate = scripts[index]!
        const url = endpointUrl(host, candidate)
        for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value)

        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeout)

        try {
            const response = await fetch(url, {
                redirect: 'follow',
                headers: {
                    // Prefer the requested representation, but do not trigger Apache/MultiViews 406
                    // merely because the physical endpoint is a PHP/text resource.
                    Accept: format === 'XML'
                        ? 'application/xml, text/xml;q=0.9, */*;q=0.8'
                        : 'application/json, */*;q=0.8',
                    'User-Agent': `MegaSport/1.0 (${process.env.TIENDA_ID ?? 'MEGASPORT'})`,
                    'ngrok-skip-browser-warning': '1',
                    'X-Tunnel-Skip-AntiPhishing-Page': 'True',
                },
                signal: controller.signal,
            })
            const body = await response.text()
            const contentType = response.headers.get('content-type')

            try {
                // Some peer services return useful APROBADO/DENEGADO or error data with HTTP >= 400.
                // If the payload is valid JSON/XML, let the contract layer decide what it means.
                return parseExternalBody(body, format, contentType)
            } catch {
                const pathLooksMissing = [404, 405, 406].includes(response.status) || looksLikeHtml(body, contentType)
                const canTryPhp = index + 1 < scripts.length && pathLooksMissing
                if (canTryPhp) {
                    lastError = new HttpError(502, `El servicio externo respondió con código ${response.status}; probando la ruta .php`)
                    continue
                }

                if (!response.ok) {
                    throw new HttpError(502, `El servicio externo respondió con código ${response.status}`)
                }
                throw new HttpError(502, 'El servicio externo devolvió una respuesta que no es JSON/XML válido')
            }
        } catch (error) {
            if (error instanceof HttpError) {
                lastError = error
                // Only fall through to a .php candidate for path/content negotiation failures.
                if (index + 1 < scripts.length && /código (404|405|406)|ruta \.php/i.test(error.message)) continue
                throw error
            }
            if (error instanceof Error && error.name === 'AbortError') {
                throw new HttpError(504, 'El servicio externo tardó demasiado en responder')
            }
            throw new HttpError(502, 'No fue posible comunicarse con el servicio externo')
        } finally {
            clearTimeout(timer)
        }
    }

    throw lastError ?? new HttpError(502, 'No fue posible obtener una respuesta válida del servicio externo')
}
