export type Courier = {
    identificador: string
    activo: boolean
    nombre: string
    host: string
    scriptConsulta: string
    scriptEnvio: string
    scriptStatus: string
}

export type CourierQuote = {
    courierId: string
    courierName: string
    cobertura: boolean
    costoEnvio: number | null
    mensaje: string
    
}