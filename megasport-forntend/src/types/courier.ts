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

export type ShippingStatus =
  | 1
  | 2
  | 3
  | 4
  | 5

export const SHIPPING_STATUS_LABELS: Record<ShippingStatus, string> = {
  1: 'Orden Nueva',
  2: 'Orden Surtiendose',
  3: 'Orden Empacandose',
  4: 'Orden En ruta',
  5: 'Orden Entregada'
}

export type ShipmentRequest = {
  idOrdenTemporal: string
  codigoDestino: string
  direccionEnvio: string
}

export type ShipmentCreationResult = {
  courierId: string
  numeroEnvio: string
  estadoEnvio: ShippingStatus
}

export type ShipmentStatusResult = {
  courierId: string
  numeroEnvio: string
  estadoEnvio: ShippingStatus
}