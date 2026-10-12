import { HttpError } from '../utils/httpError.js'
import { cents } from '../utils/validation.js'
import { externalField, flattenExternalPayload } from './externalContract.js'

function yesNo(value: string | undefined): boolean | null {
    const normalized = (value ?? '').trim().toLowerCase()
    if (['true', '1', 'si', 'sí', 'yes'].includes(normalized)) return true
    if (['false', '0', 'no'].includes(normalized)) return false
    return null
}

function parseFlexibleCost(value: string): number {
    const cleaned = value.replace(/[^0-9.-]/g, '')
    if (!cleaned || cleaned === '-' || cleaned === '.') throw new Error('Costo inválido')
    return cents(cleaned) / 100
}

export function parseCourierQuote(response: Record<string, unknown>) {
    const rawCoverage = externalField(response, 'cobertura', 'cubre', 'coverage')
    const coverage = yesNo(rawCoverage)
    if (coverage === null)
        throw new HttpError(502, 'Respuesta del courier inválida: falta cobertura o su valor no es reconocido')

    let costoEnvio: number | null = null
    if (coverage) {
        const rawCost = externalField(response, 'costo', 'precio', 'monto', 'tarifa')
        if (!rawCost) throw new HttpError(502, 'El courier confirmó cobertura pero no devolvió un costo válido')
        try { costoEnvio = parseFlexibleCost(rawCost) }
        catch { throw new HttpError(502, 'El courier confirmó cobertura pero devolvió un costo inválido') }
    }

    return {
        cobertura: coverage,
        costoEnvio,
        tiempoEstimado: externalField(response, 'tiempo_estimado', 'tiempo', 'dias', 'entrega') ?? null,
    }
}

export function parseShipmentResponse(response: Record<string, unknown>, orderReference: string) {
    const flat = flattenExternalPayload(response)
    const number = externalField(response, 'numero', 'num_envio', 'numero_envio', 'guia', 'envio', 'tracking')
    const status = externalField(response, 'status', 'estado', 'estatus')?.toUpperCase()
    const rejection = /DENEGAD|RECHAZAD|ERROR|SIN[\s_]COBERTURA|INVALID/
    const rejected = number === '0' || 'error' in flat || (status !== undefined && rejection.test(status))

    if (rejected) {
        const message = externalField(response, 'mensaje', 'descripcion', 'motivo', 'error')
        throw new HttpError(502, message ? `El courier rechazó el envío: ${message}` : 'El courier rechazó la solicitud de envío')
    }

    // The academic protocol does not require a tracking number in every implementation.
    // All couriers do receive our order number, and /status is queried using that order number.
    return {
        numeroEnvio: number ?? orderReference,
        status: status ?? 'SOLICITADO',
        fecha: externalField(response, 'fecha', 'fecha_envio') ?? null,
        hora: externalField(response, 'hora') ?? null,
        mensaje: externalField(response, 'mensaje', 'descripcion', 'motivo') ?? null,
    }
}
