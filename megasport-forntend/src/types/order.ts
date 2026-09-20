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