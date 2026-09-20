import { cardPrefixMap } from "../data/cards";
import { cardProviders } from "../data/cards";
import type { CardProvider } from "../types/card";
import type { PaymentAuthorizationRequest } from "../types/card";
import type { PaymentAuthorizationResult } from "../types/card";

function wait(ms: number) {
    return new Promise<void>((resolve) =>{
        setTimeout(resolve, ms)
    })
}

export function identificarTarjetaPorNumero(numeroTarjeta:string): CardProvider | null {
    const cleanNumber = numeroTarjeta.replace(/\D/g, '')

    if (cleanNumber.length < 1) {
        return null
    }

    const prefix = cleanNumber.slice(0,1)
    const providerId = cardPrefixMap[prefix]
    
    if (!providerId){
        return null
    }

    const provider = cardProviders.find((provider) => provider.identificador === providerId && provider.activo)

    return provider ?? null
}

export async function autorizarPago(request:PaymentAuthorizationRequest): Promise<PaymentAuthorizationResult> {
    await wait(800 + Math.random() * 1000)

    const provider = identificarTarjetaPorNumero(request.numeroTarjeta)

    if(!provider){
        return {
            issuerId: '',
            issuerName: 'Desconocido',
            status: 'DENEGADO',
            authorizationNumber: null,
            message: 'No se identifico correctamente el proveedor de la tarjeta'
        }
    }

    {/* Esto de aqui es una mulada que voy a poner nada mas para ver la simulacion local, si el ultimo numero de la tarjeta es
        par entonces aprobado, si no pues denegado */}

    const lastDigit =Number(request.numeroTarjeta.slice(-1))

    const approved = lastDigit % 2 === 0

    if (!approved){
        return {
            issuerId: provider.identificador,
            issuerName: provider.nombre,
            status: 'DENEGADO',
            authorizationNumber: null,
            message: 'La transaccion fue denegada por el proveedor'
        }
    }

    const authorizationNumber = `AUTH-${Date.now().toString().slice(-8)}`

    return {
        issuerId: provider.identificador,
        issuerName: provider.nombre,
        status: 'APROBADO',
        authorizationNumber,
        message: 'La transaccion fue aprobada con exito'
    }
}