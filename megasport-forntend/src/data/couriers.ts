import type { Courier } from '../types/courier'
 {/* Estos de aqui son unos couriers de ejemplo que pedi a la IA que hiciera, estos obviamente se van a reemplazar cuando 
    ya se sepan los curiers y se implementen en el Backend como corresponde, pero por mientras uso estos para simulacion */}

export const couriers: Courier[] = [
  {
    identificador: 'COUR-001',
    activo: true,
    nombre: 'GuateExpress',
    host: '192.168.50.11',
    scriptConsulta: '/consulta',
    scriptEnvio: '/envio',
    scriptStatus: '/status',
  },

  {
    identificador: 'COUR-002',
    activo: true,
    nombre: 'RapidCargo',
    host: '192.168.50.12',
    scriptConsulta: '/consulta',
    scriptEnvio: '/envio',
    scriptStatus: '/status',
  },

  {
    identificador: 'COUR-003',
    activo: true,
    nombre: 'MayaCourier',
    host: '192.168.50.13',
    scriptConsulta: '/consulta',
    scriptEnvio: '/envio',
    scriptStatus: '/status',
  },
]

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