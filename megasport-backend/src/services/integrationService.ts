import { pool } from '../config/database.js'
import { HttpError } from '../utils/httpError.js'
import { callExternalService, type ExternalFormat } from './externalHttpService.js'
import { cents } from '../utils/validation.js'

export function serviceMode(): 'mock'|'live' {
    const mode=process.env.EXTERNAL_SERVICES_MODE ?? 'mock'
    if (mode !== 'mock' && mode !== 'live') throw new HttpError(500, 'EXTERNAL_SERVICES_MODE debe ser mock o live')
    return mode
}

type CourierRow = {
    identificador: string
    nombre: string
    host: string
    script_de_consulta: string
    script_de_envio: string
    script_de_status: string
}

type CardRow = {
    identificador: string
    nombre: string
    host: string
    script_de_autorizacion: string
}

function textValue(value: unknown): string {
    return value === undefined || value === null ? '' : String(value)
}

function booleanValue(value: unknown): boolean {
    return value === true || ['true', '1', 'si', 'sí'].includes(textValue(value).toLowerCase())
}

function numberValue(value: unknown): number | null {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

async function activeCourier(id: string): Promise<CourierRow> {
    const result = await pool.query<CourierRow>(
        `SELECT identificador, nombre, host, script_de_consulta, script_de_envio, script_de_status
         FROM courier WHERE identificador = $1 AND activo = TRUE`,
        [id],
    )
    if (!result.rows[0]) {
        throw new HttpError(404, 'El courier no existe o está inactivo')
    }
    return result.rows[0]
}

export async function quoteAllCouriers(destino: string, formato: ExternalFormat) {
    const result = await pool.query<CourierRow>(
        `SELECT identificador, nombre, host, script_de_consulta, script_de_envio, script_de_status
         FROM courier WHERE activo = TRUE ORDER BY identificador`,
    )

    return Promise.all(result.rows.map(async (courier) => {
        try {
            if(serviceMode()==='mock') return {courierId:courier.identificador, courierName:courier.nombre,
                cobertura:true, costoEnvio:25, mensaje:'SIMULACIÓN: tarifa de prueba Q25'}
            const response = await callExternalService(
                courier.host,
                courier.script_de_consulta,
                { destino, formato },
                formato,
            )
            const cost = booleanValue(response.cobertura) ? cents(response.costo)/100 : null
            return {
                courierId: courier.identificador,
                courierName: textValue(response.courier) || courier.nombre,
                cobertura: booleanValue(response.cobertura),
                costoEnvio: cost,
                mensaje: booleanValue(response.cobertura) ? 'Cobertura disponible' : 'Destino sin cobertura',
            }
        } catch (error) {
            return {
                courierId: courier.identificador,
                courierName: courier.nombre,
                cobertura: false,
                costoEnvio: null,
                mensaje: error instanceof Error ? error.message : 'No se pudo consultar este courier',
            }
        }
    }))
}

export async function requestShipment(
    courierId: string,
    data: { orden: string; destinatario: string; destino: string; direccion: string; formato: ExternalFormat },
) {
    const courier = await activeCourier(courierId)
    if(serviceMode()==='mock') return {courierId, numeroEnvio:`SIM-ENV-${data.orden}`,estadoEnvio:1}
    const response = await callExternalService(
        courier.host,
        courier.script_de_envio,
        {
            orden: data.orden,
            destinatario: data.destinatario,
            destino: data.destino,
            direccion: data.direccion,
            tienda: process.env.TIENDA_ID ?? 'MEGASPORT',
            formato: data.formato,
        },
        data.formato,
    )
    const shippingNumber = textValue(response.numero_envio ?? response.numeroEnvio ?? response.numero)
    if (!shippingNumber) {
        throw new HttpError(502, 'El courier no devolvió un número de envío')
    }
    const status = Number(response.estado_envio ?? response.estadoEnvio ?? response.status ?? 1)
    return {
        courierId: courier.identificador,
        numeroEnvio: shippingNumber,
        estadoEnvio: status >= 1 && status <= 5 ? status : 1,
    }
}

export async function requestShipmentStatus(
    courierId: string,
    orden: string,
    formato: ExternalFormat,
) {
    const courier = await activeCourier(courierId)
    if(serviceMode()==='mock') return {courierId,numeroEnvio:`SIM-ENV-${orden}`,estadoEnvio:1}
    const response = await callExternalService(
        courier.host,
        courier.script_de_status,
        { orden, tienda: process.env.TIENDA_ID ?? 'MEGASPORT', formato },
        formato,
    )
    const status = Number(response.estado_envio ?? response.estadoEnvio ?? response.status ?? response.estado)
    if (!Number.isInteger(status) || status < 1 || status > 5) {
        throw new HttpError(502, 'El courier devolvió un estado de envío inválido')
    }
    return { courierId: courier.identificador, numeroEnvio: orden, estadoEnvio: status }
}

export const CARD_PREFIX: Record<string, string> = {
    '4': 'VISA',
    '5': 'MASTERCARD',
    '3': 'AMERICANEXPRESS',
    '2': 'CREDOMATIC',
}

export async function authorizeCard(data: {
    tarjeta: string
    nombre: string
    fechaVencimiento: string
    numeroSeguridad: string
    monto: number
    formato: ExternalFormat
}) {
    const issuerId = CARD_PREFIX[data.tarjeta.charAt(0)]
    if (!issuerId) {
        throw new HttpError(400, 'No se reconoce el emisor de la tarjeta')
    }
    const result = await pool.query<CardRow>(
        `SELECT identificador, nombre, host, script_de_autorizacion
         FROM tarjeta WHERE identificador = $1 AND activo = TRUE`,
        [issuerId],
    )
    const issuer = result.rows[0]
    if (!issuer) {
        throw new HttpError(404, 'El emisor de tarjeta no está disponible')
    }

    if(serviceMode()==='mock') {
        const approved = Number(data.tarjeta.slice(-1)) % 2 === 0
        return {issuerId:issuer.identificador,issuerName:issuer.nombre,
            status:approved ? 'APROBADO' as const : 'DENEGADO' as const,
            authorizationNumber:approved ? `SIM-AUTH-${crypto.randomUUID()}` : null,
            message:'SIMULACIÓN: no se realizó un cobro'}
    }

    const response = await callExternalService(
        issuer.host,
        issuer.script_de_autorizacion,
        {
            tarjeta: data.tarjeta,
            nombre: data.nombre,
            fecha_venc: data.fechaVencimiento,
            num_seguridad: data.numeroSeguridad,
            monto: data.monto.toFixed(2),
            tienda: process.env.TIENDA_ID ?? 'MEGASPORT',
            formato: data.formato,
        },
        data.formato,
    )
    const rawStatus = textValue(response.status ?? response.estado).toUpperCase()
    const approved = ['APROBADO', 'APPROVED', '1', 'TRUE'].includes(rawStatus)
    const authorization = textValue(response.numero ?? response.numero_autorizacion ?? response.authorizationNumber)
    const denied = ['DENEGADO','RECHAZADO','DENIED','0','FALSE'].includes(rawStatus)
    if ((!approved && !denied) || (approved && (!authorization || authorization==='0' || authorization.length>100)))
        throw new HttpError(502, 'Respuesta de pago ambigua; requiere revisión con el emisor')

    return {
        issuerId: issuer.identificador,
        issuerName: textValue(response.emisor) || issuer.nombre,
        status: approved ? 'APROBADO' as const : 'DENEGADO' as const,
        authorizationNumber: approved && authorization && authorization !== '0' ? authorization : null,
        message: approved ? 'La transacción fue aprobada' : 'La transacción fue denegada por el emisor',
    }
}
