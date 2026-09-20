export type CardProvider = {
    identificador: string
    activo: boolean
    nombre: string
    host: string
    scriptAutorizacion: string
}

export type PaymentAuthorizationRequest = {
    numeroTarjeta: string
    titular: string
    vencimiento: string
    seguridad: string
    monto: number
    tienda: string
    formato: 'JSON' | 'XML'
}

export type PaymentAuthorizationResult = {
    issuerId: string
    issuerName: string
    status : 'APROBADO' | 'DENEGADO'
    authorizationNumber: string | null
    message: string
}