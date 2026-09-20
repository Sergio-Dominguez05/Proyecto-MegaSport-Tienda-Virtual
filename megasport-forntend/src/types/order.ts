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
    detalles: OrderDetailDraft[]

}