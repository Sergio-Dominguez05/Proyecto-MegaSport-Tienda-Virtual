import {api} from './api'
import type {CourierQuote} from '../types/courier'
// El backend decide mock/live y consulta exclusivamente hosts configurados en BD.
export function consultarTodosLosCouriers(codigoDestino:string):Promise<CourierQuote[]>{
    return api(`/integraciones/couriers/cotizaciones?destino=${encodeURIComponent(codigoDestino)}&formato=JSON`)
}
