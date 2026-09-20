import type { CardProvider } from '../types/card'

{/* Estos son datos de prueba para la simulacion local que pedi a la IA que hiciera, en la parte real obviamente va a hacer
    fetch a al grupo asignado a la tarjeta de credito especifica */}


export const cardProviders: CardProvider[] = [
  {
    identificador: 'TARJ-VISA',
    activo: true,
    nombre: 'Visa',
    host: '192.168.60.11',
    scriptAutorizacion: '/autorizacion',
  },

  {
    identificador: 'TARJ-MASTER',
    activo: true,
    nombre: 'Mastercard',
    host: '192.168.60.12',
    scriptAutorizacion: '/autorizacion',
  },

  {
    identificador: 'TARJ-CREDO',
    activo: true,
    nombre: 'Credomatic',
    host: '192.168.60.13',
    scriptAutorizacion: '/autorizacion',
  },
]

{/*Esto de aqui si obviamente no lo hizo la IA y son los prefijos de los otros grupos para identificar al proveedor */}

export const cardPrefixMap: Record<string, string> = {
  '4': 'TARJ-VISA',
  '5': 'TARJ-MASTER',
  '3': 'TARJ-AMEX',
  '2': 'TARJ-CREDO'
}