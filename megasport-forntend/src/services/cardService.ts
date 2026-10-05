// Compatibilidad para identificación visual. La autorización se realiza únicamente
// mediante POST /ordenes/:id/pagar; nunca se autoriza un monto enviado por el cliente.
import {cardPrefixMap,cardProviders} from '../data/cards'
import type {CardProvider} from '../types/card'
export function identificarTarjetaPorNumero(numero:string):CardProvider|null {
    const prefix=numero.replace(/\D/g,'').slice(0,1)
    const id=cardPrefixMap[prefix]
    return cardProviders.find(p=>p.identificador===id&&p.activo)??null
}
