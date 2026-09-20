import type { ShippingStatus } from "./courier"

export type OrderDetailDraft = {
    idVariante: number
    cantidad: number
    precioPorUnidad: number
}

export type OrderDraft = {
    idTemporal: string
    creadoEn: string
    subtotalAntesDeEnvio: number
    direccionDeEnvio: string
    codigoDelDestino: string
    idCourier: string | null
    costoEnvio: number
    total: number
    idTarjeta: string | null
    estadoDePagado: PaymentStatus
    numAutorizacion: string | null
    detalles: OrderDetailDraft[]

}

export type PaymentStatus =
    | 'PENDIENTE'
    | 'APROBADO'
    | 'DENEGADO'

export type FinalizedOrder = {
    id: string
    creadoEn: string  
    subtotalAntesDeEnvio: number
    costoEnvio: number
    total: number
    direccionDeEnvio: string
    codigoDelDestino: string
    idCourier: string
    idTarjeta: string
    estadoDePagado: 'APROBADO'
    numAutorizacion: string
    numEnvio: string
    estadoEnvio: ShippingStatus
    detalles: OrderDetailDraft[]
}