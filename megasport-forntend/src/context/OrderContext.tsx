/* eslint-disable react-refresh/only-export-components */
import {createContext,useContext,useState} from 'react'
import type {ReactNode} from 'react'
import type {OrderDraft,OrderDetailDraft} from '../types/order'
import {useAuth} from '../hooks/useAuth'
type Value={
    orderDraft:OrderDraft|null
    startOrder:(data:{subtotalAntesDelEnvio:number;detalles:OrderDetailDraft[]})=>void
    updateShippingData:(data:{direccionDeEnvio:string;codigoDelDestino:string})=>void
    selectCourier:(data:{idCourier:string;costoEnvio:number})=>void
}
const Context=createContext<Value|null>(null)
export function OrderProvider({children}:{children:ReactNode}){
    const {user}=useAuth()
    return <DraftProvider key={user?.id??'guest'}>{children}</DraftProvider>
}
function DraftProvider({children}:{children:ReactNode}){
    // Solo borrador en memoria; las órdenes reales viven en PostgreSQL.
    const [orderDraft,setDraft]=useState<OrderDraft|null>(null)
    return <Context.Provider value={{
        orderDraft,
        startOrder:data=>setDraft({idTemporal:crypto.randomUUID(),creadoEn:new Date().toISOString(),
            subtotalAntesDeEnvio:data.subtotalAntesDelEnvio,total:data.subtotalAntesDelEnvio,
            direccionDeEnvio:'',codigoDelDestino:'',idCourier:null,costoEnvio:0,
            idTarjeta:null,estadoDePagado:'PENDIENTE',numAutorizacion:null,detalles:data.detalles}),
        updateShippingData:data=>setDraft(o=>o?{...o,...data,idTemporal:crypto.randomUUID(),idCourier:null,costoEnvio:0,total:o.subtotalAntesDeEnvio}:null),
        selectCourier:data=>setDraft(o=>o?{...o,...data,total:o.subtotalAntesDeEnvio+data.costoEnvio}:null)
    }}>{children}</Context.Provider>
}
export function useOrder(){const c=useContext(Context);if(!c)throw new Error('Falta OrderProvider');return c}
