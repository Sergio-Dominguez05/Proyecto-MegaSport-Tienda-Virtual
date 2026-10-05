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

export async function callExternalService(
    host: string,
    script: string,
    query: Record<string, string>,
    format: ExternalFormat,
): Promise<Record<string, unknown>> {
    const url = endpointUrl(host, script)
    for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value)
    }

    const timeout = Number(process.env.EXTERNAL_SERVICE_TIMEOUT_MS) || 8000
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
        const response = await fetch(url, {
            redirect: 'error',
            headers: { Accept: format === 'XML' ? 'application/xml' : 'application/json' },
            signal: controller.signal,
        })
        const body = await response.text()

        if (!response.ok) {
            throw new HttpError(502, `El servicio externo respondió con código ${response.status}`)
        }

        if (format === 'XML' || response.headers.get('content-type')?.includes('xml')) {
            const parsed = new XMLParser({ ignoreAttributes: false, parseTagValue: false }).parse(body) as Record<string, unknown>
            const firstValue = Object.entries(parsed).find(([key])=>!key.startsWith('?'))?.[1]
            return typeof firstValue === 'object' && firstValue !== null
                ? firstValue as Record<string, unknown>
                : parsed
        }

        try {
            const parsed: unknown = JSON.parse(body)
            if (!parsed || typeof parsed!=='object' || Array.isArray(parsed)) throw new Error('Respuesta inválida')
            return parsed as Record<string, unknown>
        } catch {
            throw new HttpError(502, 'El servicio externo devolvió un JSON inválido')
        }
    } catch (error) {
        if (error instanceof HttpError) {
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
