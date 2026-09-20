import { couriers } from "../data/couriers";
import type { Courier } from "../types/courier";
import type { CourierQuote } from "../types/courier";

type MockCourierRule = {
    baseCost: number
    zoneMultiplier: number
    maxZone: number
    excludedZones: number[]
}


{/*Datos de prueba, nuevamente solicitados a la IA para la simulacion local. */}
const mockRules: Record<string, MockCourierRule> = {
  'COUR-001': {
    baseCost: 25,
    zoneMultiplier: 2.25,
    maxZone: 22,
    excludedZones: [],
  },

  'COUR-002': {
    baseCost: 20,
    zoneMultiplier: 2.75,
    maxZone: 18,
    excludedZones: [],
  },

  'COUR-003': {
    baseCost: 30,
    zoneMultiplier: 1.90,
    maxZone: 22,
    excludedZones: [4, 9, 15],
  },
}

function wait(ms: number){
    return new Promise<void>((resolve) => {setTimeout(resolve, ms)})
}

function calculateMockZone(codigoDestino: string){
    const value = codigoDestino.split('').reduce((total, character) => total + character.charCodeAt(0), 0)

    return (value % 22) + 1
}

export async function consultarCourier(
    courier: Courier,
    codigoDestino: string
): Promise<CourierQuote> {
    /*Esta vaina de aqui es lo que simula el courier localmente, ya despues aqui se va a hacer el fetch de verdad */
    await wait(500 + Math.random() * 900)
    if(!courier.activo){
        return{
            courierId: courier.identificador,
            courierName: courier.nombre,
            cobertura: false,
            costoEnvio: null,
            mensaje: 'Este courier no esta disponible ahora, porfavor pruebe otro courier'
        }
    }

    if (codigoDestino.trim().length !== 5){
        return{
            courierId: courier.identificador,
            courierName: courier.nombre,
            cobertura: false,
            costoEnvio: null,
            mensaje: 'El codigo de destino no es valido'
        }
    }

    const rule = mockRules[courier.identificador]

    if (!rule){
        return {
            courierId: courier.identificador,
            courierName: courier.nombre,
            cobertura: false,
            costoEnvio: null,
            mensaje: 'No existe la configuarcion de courier que se quiso colocar'
        }
    }

    const zone = calculateMockZone(codigoDestino)

    const hasCoverage = zone <= rule.maxZone && !rule.excludedZones.includes(zone)

    if (!hasCoverage){
        return{
            courierId: courier.identificador,
            courierName: courier.nombre,
            cobertura: false,
            costoEnvio: null,
            mensaje: 'La zona a la que se quiere enviar no tiene cobertura con este courier'
        }
    }

    const cost = rule.baseCost + zone * rule.zoneMultiplier

    return {
            courierId: courier.identificador,
            courierName: courier.nombre,
            cobertura: true,
            costoEnvio: Math.round(cost * 100) / 100,
            mensaje: 'Cobertura disponible'
    }

}

export async function consultarTodosLosCouriers(codigoDestino: string): Promise<CourierQuote[]> {
    const activeCouriers = couriers.filter((courier) => courier.activo)

    const results = await Promise.all(activeCouriers.map((courier) => consultarCourier(courier, codigoDestino)))

    return results
}