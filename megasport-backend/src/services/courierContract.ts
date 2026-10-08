import { HttpError } from '../utils/httpError.js'
import { cents } from '../utils/validation.js'

// JSON envelopes used by the peer services; XML may already be unwrapped.
export function courierPayload(response: Record<string, unknown>, wrapper: string): Record<string, unknown> {
    const nested = response[wrapper]
    if (nested === undefined) return response
    if (!nested || typeof nested !== 'object' || Array.isArray(nested))
        throw new HttpError(502, 'El courier devolvió una respuesta con estructura inválida')
    return nested as Record<string, unknown>
}

export function parseCourierQuote(response: Record<string, unknown>) {
    const payload = courierPayload(response, 'consultaprecio')
    const raw = payload.cobertura
    const normalized = String(raw ?? '').trim().toLowerCase()
    const yes = ['true', '1', 'si', 'sí'].includes(normalized)
    const no = ['false', '0', 'no'].includes(normalized)
    if (!yes && !no)
        throw new HttpError(502, 'Respuesta del courier inválida: falta cobertura o su valor no es reconocido')
    let costoEnvio: number | null = null
    if (yes) {
        if (!['number', 'string'].includes(typeof payload.costo) || String(payload.costo).trim() === '')
            throw new HttpError(502, 'El courier confirmó cobertura pero no devolvió un costo válido')
        try { costoEnvio = cents(payload.costo) / 100 }
        catch { throw new HttpError(502, 'El courier confirmó cobertura pero devolvió un costo inválido') }
    }
    return { cobertura: yes, costoEnvio }
}
