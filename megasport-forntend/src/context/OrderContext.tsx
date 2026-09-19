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

type OrderContextType ={
    orderDraft: OrderDraft | null

    startOrder: (
        data: StartOrderData
    ) => void

    updateShippingData: (
        data: ShippingData
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
                codigoDelDestino: data.codigoDelDestino
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