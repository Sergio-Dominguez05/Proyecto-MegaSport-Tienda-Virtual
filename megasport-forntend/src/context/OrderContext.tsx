import { createContext } from "react";
import { useContext } from "react";
import { useEffect } from "react";
import { useState } from "react";
import type { ReactNode } from "react";
import type { OrderDetailDraft } from "../types/order";
import type { OrderDraft } from "../types/order";

type StartOrderData = {
    subtotalAntesDelEnvio: number
    detalles: OrderDetailDraft[]
}

type ShippingData = {
    direccionDeEnvio: string
    codigoDelDestino: string
}

type CourierSelectionData = {
    idCourier: string
    costoEnvio: number
}

type PaymentResultData= {
    idTarjeta: string
    estadoDePagado:
        | 'APROBADO'
        | 'DENEGADO'
    numAutorizacion: string | null
}

type OrderContextType ={
    orderDraft: OrderDraft | null
    

    startOrder: (
        data: StartOrderData
    ) => void

    updateShippingData: (
        data: ShippingData
    ) => void

    selectCourier: (
        data: CourierSelectionData
    ) => void

    registerPaymentResult: (
        data: PaymentResultData
    ) => void

    clearOrderDraft: (

    ) => void
}

const OrderContext = createContext<OrderContextType | undefined>(
    undefined
)

type OrderProviderProps = {
    children: ReactNode
}

function OrderProvider ({children} : OrderProviderProps){
    const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(() => {
        const savedOrder = localStorage.getItem('megasport-order-draft')
        if (!savedOrder){
            return null
        }
        try {
            return JSON.parse(savedOrder)
        } catch {
            return null
        }
    })

    useEffect(() => {
        if (orderDraft){
            localStorage.setItem('megasport-order-draft', JSON.stringify(orderDraft))
        } else {
            localStorage.removeItem('megasport-order-draft')
        }
    }, [orderDraft])

    const startOrder = (data: StartOrderData) => {
        const newOrder: OrderDraft = {
            idTemporal: crypto.randomUUID(),
            creadoEn: new Date().toISOString(),
            subtotalAntesDeEnvio: data.subtotalAntesDelEnvio,
            direccionDeEnvio: '',
            codigoDelDestino: '',
            idCourier: null,
            costoEnvio: 0,
            total: data.subtotalAntesDelEnvio,
            idTarjeta: null,
            estadoDePagado: 'PENDIENTE',
            numAutorizacion: null,
            detalles: data.detalles
        }
        setOrderDraft(newOrder)
    }

    const updateShippingData = ( data: ShippingData) =>{
        setOrderDraft((currentOrder) => {
            if (!currentOrder){
                return null
            }
            return{
                ...currentOrder,
                direccionDeEnvio: data.direccionDeEnvio,
                codigoDelDestino: data.codigoDelDestino,
                idCourier: null,
                costoEnvio: 0,
                total: currentOrder.subtotalAntesDeEnvio
            }
        })
    }

    const selectCourier = (data: CourierSelectionData) => {
        setOrderDraft((currentOrder) => {
            if (!currentOrder){
                return null
            }

            return{
                ...currentOrder,
                idCourier: data.idCourier,
                costoEnvio: data.costoEnvio,
                total: currentOrder.subtotalAntesDeEnvio + data.costoEnvio,
                idTarjeta: null,
                estadoDePagado: 'PENDIENTE',
                numAutorizacion: null
            }
        })
    }

    const registerPaymentResult = (data: PaymentResultData) => {
        setOrderDraft((currentOrder) => {
            if(!currentOrder){
                return null
            }
            return{
                ...currentOrder,
                idTarjeta: data.idTarjeta,
                estadoDePagado: data.estadoDePagado,
                numAutorizacion: data.numAutorizacion

            }
        })
    }

    const clearOrderDraft = () => {
        setOrderDraft(null)
    }

    return (
        <OrderContext.Provider
            value={{
                orderDraft,
                startOrder,
                updateShippingData,
                selectCourier,
                registerPaymentResult,
                clearOrderDraft
            }}>

                {children}
        </OrderContext.Provider>
    )
}

function useOrder (){
    const context = useContext(OrderContext)
    if (!context){
        throw new Error('Se jodio algo porque no se esta usando el contexto bien')
    }
    return context
}

export {
    OrderProvider,
    useOrder
}