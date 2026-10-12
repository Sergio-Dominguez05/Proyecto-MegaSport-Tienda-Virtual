import { parseCourierQuote, parseShipmentResponse } from './courierContract.js'
import { externalField, normalizeExternalText } from './externalContract.js'
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
    formato: ExternalFormat
}

type CardRow = {
    identificador: string
    nombre: string
    host: string
    script_de_autorizacion: string
    formato: ExternalFormat
}

function textValue(value: unknown): string {
    return value === undefined || value === null ? '' : String(value)
}

function shippingStatusValue(value: unknown): number | null {
    const raw = textValue(value).trim()
    const directNumber = /^(\d)$/.exec(raw)?.[1]
    if (directNumber) {
        const numeric = Number(directNumber)
        return numeric >= 1 && numeric <= 5 ? numeric : null
    }

    const normalized = normalizeExternalText(raw)
        .replace(/^\d+[.\s-]*/, '')
        .replace(/[\s-]+/g, '_')

    if (['ORDEN_NUEVA', 'NUEVA', 'NUEVO', 'SOLICITADO', 'RECIBIDO', 'PENDIENTE', 'REGISTRADO'].includes(normalized)) return 1
    if (['SURTIENDOSE', 'SURTIENDO', 'EN_SURTIDO', 'PROCESANDO'].includes(normalized)) return 2
    if (['EMPACANDOSE', 'EMPACANDO', 'EMPAQUE', 'EN_EMPAQUE'].includes(normalized)) return 3
    if (['EN_RUTA', 'RUTA', 'EN_TRANSITO', 'TRANSITO', 'EN_CAMINO', 'IN_TRANSIT'].includes(normalized)) return 4
    if (['ENTREGADA', 'ENTREGADO', 'DELIVERED'].includes(normalized)) return 5
    if (['CANCELADO', 'CANCELADA', 'CANCELLED', 'CANCELED', 'DEVUELTO'].includes(normalized)) return -1
    return null
}



async function activeCourier(id: string): Promise<CourierRow> {
    const result = await pool.query<CourierRow>(
        `SELECT identificador, nombre, host, script_de_consulta, script_de_envio, script_de_status, formato
        FROM courier WHERE identificador = $1 AND activo = TRUE`,
        [id],
    )
    if (!result.rows[0]) {
        throw new HttpError(404, 'El courier no existe o está inactivo')
    }
    return result.rows[0]
}


export async function quoteAllCouriers(
    destino: string,
    formatoOverride?: ExternalFormat
) {

    const result =
        await pool.query<CourierRow>(`
            SELECT
                identificador,
                nombre,
                host,
                script_de_consulta,
                script_de_envio,
                script_de_status,
                formato
            FROM courier
            WHERE activo = TRUE
            ORDER BY identificador
        `)

    return Promise.all(
        result.rows.map(
            async (courier) => {

                try {

                    const formato =
                        formatoOverride
                        ?? courier.formato

                    if (
                        serviceMode() === 'mock'
                    ) {
                        return {
                            courierId:
                                courier.identificador,

                            courierName:
                                courier.nombre,

                            cobertura: true,
                            estadoConsulta: 'DISPONIBLE',

                            costoEnvio: 25,

                            mensaje:
                                'SIMULACIÓN: tarifa de prueba Q25'
                        }
                    }

                    const response =
                        await callExternalService(
                            courier.host,
                            courier.script_de_consulta,
                            {
                                destino: destino.toUpperCase(),
                                formato,
                            },
                            formato,
                        )

                    const quote = parseCourierQuote(response)
                    return {
                        courierId: courier.identificador,
                        courierName: courier.nombre,
                        ...quote,
                        estadoConsulta: quote.cobertura ? 'DISPONIBLE' : 'SIN_COBERTURA',
                        mensaje: quote.cobertura ? 'Cobertura disponible' : 'Destino sin cobertura',
                    }

                } catch (error) {

                    return {
                        estadoConsulta: 'ERROR',
                        courierId:
                            courier.identificador,

                        courierName:
                            courier.nombre,

                        cobertura:
                            false,

                        costoEnvio:
                            null,

                        mensaje:
                            error instanceof Error
                                ? error.message
                                : 'No se pudo consultar este courier',
                    }
                }
            }
        )
    )
}

export async function requestShipment(
    courierId: string,
    data: {
        orden: string
        destinatario: string
        destino: string
        direccion: string
        formato?: ExternalFormat
    },
) {
    const courier = await activeCourier(courierId)
    const formato = data.formato ?? courier.formato
    if(serviceMode()==='mock') return {courierId, numeroEnvio:`SIM-ENV-${data.orden}`,estadoEnvio:1}
    const response = await callExternalService(
        courier.host,
        courier.script_de_envio,
        {
            orden: data.orden,
            destinatario: data.destinatario,
            destino: data.destino.toUpperCase(),
            direccion: data.direccion,
            tienda: process.env.TIENDA_ID ?? 'MEGASPORT',
            formato,
        },
        formato,
    )
    const shipment = parseShipmentResponse(response, data.orden)
    const parsedStatus = shippingStatusValue(shipment.status)
    if (parsedStatus === -1) throw new HttpError(502, 'El courier reportó el envío como cancelado')
    return {
        courierId: courier.identificador,
        numeroEnvio: shipment.numeroEnvio,
        estadoEnvio: parsedStatus && parsedStatus >= 1 ? parsedStatus : 1,
    }
}

export async function requestShipmentStatus(
    courierId: string,
    orden: string,
    formatoOverride?: ExternalFormat,
) {
    const courier = await activeCourier(courierId)
    const formato = formatoOverride ?? courier.formato
    if(serviceMode()==='mock') return {courierId,numeroEnvio:`SIM-ENV-${orden}`,estadoEnvio:1}
    const response = await callExternalService(
        courier.host,
        courier.script_de_status,
        {
            orden,
            tienda: process.env.TIENDA_ID ?? 'MEGASPORT',
            formato,
        },
        formato,
    )
    const rawStatus = externalField(response, 'status', 'estado', 'estatus')
    const status = shippingStatusValue(rawStatus)

    if (status === -1) throw new HttpError(502, 'El courier reportó el envío como cancelado')
    if (status === null) {
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
    formato?: ExternalFormat
}) {
    const issuerId = CARD_PREFIX[data.tarjeta.charAt(0)]
    if (!issuerId) {
        throw new HttpError(400, 'No se reconoce el emisor de la tarjeta')
    }
    const result = await pool.query<CardRow>(
        `SELECT identificador, nombre, host, script_de_autorizacion, formato
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

    const formato = data.formato ?? issuer.formato

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
            formato,
        },
        formato,
    )
    const rawStatus = normalizeExternalText(
        externalField(response, 'status', 'estado', 'estatus', 'resultado') ?? ''
    )
    const approved = [
        'APROBADO', 'APROBADA', 'AUTORIZADO', 'AUTORIZADA',
        'APPROVED', 'OK', '1', 'TRUE',
    ].includes(rawStatus)
    const denied = [
        'DENEGADO', 'DENEGADA', 'RECHAZADO', 'RECHAZADA',
        'DENIED', 'REJECTED', '0', 'FALSE',
    ].includes(rawStatus)
    const authorization = externalField(
        response,
        'numero', 'num_autorizacion', 'autorizacion',
        'numero_autorizacion', 'codigo', 'authorizationnumber',
    ) ?? ''

    if ((!approved && !denied) || (approved && (!authorization || authorization === '0' || authorization.length > 100)))
        throw new HttpError(502, 'Respuesta de pago ambigua; requiere revisión con el emisor')

    return {
        issuerId: issuer.identificador,
        issuerName: externalField(response, 'emisor', 'issuer') || issuer.nombre,
        status: approved ? 'APROBADO' as const : 'DENEGADO' as const,
        authorizationNumber: approved ? authorization : null,
        message: externalField(response, 'mensaje', 'motivo', 'descripcion', 'razon')
            ?? (approved ? 'La transacción fue aprobada' : 'La transacción fue denegada por el emisor'),
    }
}
