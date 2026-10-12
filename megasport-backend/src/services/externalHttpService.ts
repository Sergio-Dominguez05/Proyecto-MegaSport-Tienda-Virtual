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

function externalLoggingEnabled(): boolean {
    return (process.env.EXTERNAL_SERVICE_LOGGING ?? 'true').trim().toLowerCase() !== 'false'
}

function maskedUrl(url: URL): string {
    const safe = new URL(url.toString())
    const card = safe.searchParams.get('tarjeta')
    if (card) safe.searchParams.set('tarjeta', `${'*'.repeat(Math.max(0, card.length - 4))}${card.slice(-4)}`)
    if (safe.searchParams.has('num_seguridad')) safe.searchParams.set('num_seguridad', '***')
    return safe.toString()
}

function maskSensitiveText(value: string): string {
    let safe = value

    safe = safe.replace(/("tarjeta"\s*:\s*")([^"\\]+)(")/gi, (_m, p1: string, card: string, p3: string) =>
        `${p1}${'*'.repeat(Math.max(0, card.length - 4))}${card.slice(-4)}${p3}`,
    )
    safe = safe.replace(/(<tarjeta(?:\s[^>]*)?>)([^<]*)(<\/tarjeta>)/gi, (_m, p1: string, card: string, p3: string) =>
        `${p1}${'*'.repeat(Math.max(0, card.length - 4))}${card.slice(-4)}${p3}`,
    )
    safe = safe.replace(/("num_seguridad"\s*:\s*")[^"\\]+(")/gi, '$1***$2')
    safe = safe.replace(/(<num_seguridad(?:\s[^>]*)?>)[^<]*(<\/num_seguridad>)/gi, '$1***$2')

    const maxLength = 6000
    return safe.length > maxLength ? `${safe.slice(0, maxLength)}\n...[respuesta truncada]` : safe
}

function logRequest(url: URL, format: ExternalFormat, attempt: number, totalAttempts: number): void {
    if (!externalLoggingEnabled()) return
    console.log('\n[EXTERNO][SOLICITUD] --------------------------------------------------')
    console.log(`[EXTERNO] ${new Date().toISOString()} | GET | intento ${attempt}/${totalAttempts} | formato=${format}`)
    console.log(`[EXTERNO] URL: ${maskedUrl(url)}`)
}

function logResponse(response: Response, body: string, durationMs: number): void {
    if (!externalLoggingEnabled()) return
    console.log(`[EXTERNO][RESPUESTA] HTTP ${response.status} ${response.statusText} | ${durationMs} ms`)
    console.log(`[EXTERNO] Content-Type: ${response.headers.get('content-type') ?? '(sin content-type)'}`)
    console.log(`[EXTERNO] Body:\n${maskSensitiveText(body || '(vacío)')}`)
}

function logParsed(parsed: Record<string, unknown>): void {
    if (!externalLoggingEnabled()) return
    console.log(`[EXTERNO][INTERPRETADO]\n${maskSensitiveText(JSON.stringify(parsed, null, 2))}`)
    console.log('[EXTERNO] ----------------------------------------------------------------\n')
}

function logExternalError(message: string): void {
    if (!externalLoggingEnabled()) return
    console.error(`[EXTERNO][ERROR] ${message}`)
    console.log('[EXTERNO] ----------------------------------------------------------------\n')
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
        const startedAt = Date.now()
        logRequest(url, format, index + 1, scripts.length)

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
            logResponse(response, body, Date.now() - startedAt)

            try {
                // Some peer services return useful APROBADO/DENEGADO or error data with HTTP >= 400.
                // If the payload is valid JSON/XML, let the contract layer decide what it means.
                const parsed = parseExternalBody(body, format, contentType)
                logParsed(parsed)
                return parsed
            } catch {
                const pathLooksMissing = [404, 405, 406].includes(response.status) || looksLikeHtml(body, contentType)
                const canTryPhp = index + 1 < scripts.length && pathLooksMissing
                if (canTryPhp) {
                    if (externalLoggingEnabled()) {
                        console.warn(`[EXTERNO][FALLBACK] ${candidate} no produjo datos válidos; probando ${scripts[index + 1]}`)
                    }
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
                logExternalError(error.message)
                throw error
            }
            if (error instanceof Error && error.name === 'AbortError') {
                const timeoutError = new HttpError(504, `El servicio externo tardó demasiado en responder (${timeout} ms)`)
                logExternalError(timeoutError.message)
                throw timeoutError
            }
            const connectionError = new HttpError(502, 'No fue posible comunicarse con el servicio externo')
            logExternalError(`${connectionError.message}${error instanceof Error ? `: ${error.message}` : ''}`)
            throw connectionError
        } finally {
            clearTimeout(timer)
        }
    }

    const finalError = lastError ?? new HttpError(502, 'No fue posible obtener una respuesta válida del servicio externo')
    logExternalError(finalError.message)
    throw finalError
}
