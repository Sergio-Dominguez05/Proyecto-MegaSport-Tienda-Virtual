import { useEffect,useState } from 'react'
import { Link,useNavigate } from 'react-router-dom'
import { useOrder } from '../context/OrderContext'
import { api } from '../services/api'
import type { PersistedOrder } from '../types/persistedOrder'
export default function Payment(){
    const {orderDraft}=useOrder()
    const navigate=useNavigate()
    const [order,setOrder]=useState<PersistedOrder|null>(null)
    const [error,setError]=useState('')
    const [busy,setBusy]=useState(false)
    const [card,setCard]=useState({numeroTarjeta:'',titular:'',vencimiento:'',seguridad:''})
    useEffect(()=>{
        if(!orderDraft?.idCourier) return
        let cancelled=false
        void api<PersistedOrder>('/ordenes','POST',{
            clave:orderDraft.idTemporal,courierId:orderDraft.idCourier,
            destino:orderDraft.codigoDelDestino,direccion:orderDraft.direccionDeEnvio
        }).then(data=>{if(!cancelled)setOrder(data)})
          .catch(e=>{if(!cancelled)setError(e.message)})
        return ()=>{cancelled=true}
    },[orderDraft])
    async function pay(){
        if(!order||busy)return
        setBusy(true);setError('')
        try{
            const updated=await api<PersistedOrder>(`/ordenes/${order.id}/pagar`,'POST',card)
            setCard({numeroTarjeta:'',titular:'',vencimiento:'',seguridad:''})
            navigate(`/orden/${updated.id}`,{replace:true})
        }catch(e){setError(e instanceof Error?e.message:'Revisa Mis pedidos antes de repetir.')}
        finally{setBusy(false)}
    }
    return <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold">Confirmar compra</h1>
        <p className="mt-3">El total y la disponibilidad se verifican en el servidor.</p>
        {error&&<p role="alert" className="my-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
        {!order&&!error&&<p className="my-6">{orderDraft?.idCourier?'Preparando orden…':'Selecciona primero productos, dirección y courier.'}</p>}
        {order&&<section className="my-6 space-y-5 rounded-2xl border p-6">
            <p>Orden #{order.id} · {order.estado_de_pagado}</p>
            {order.modo==='mock'&&<p className="rounded-lg bg-yellow-50 p-3">MODO DE PRUEBA. Solo datos ficticios. No se cobran tarjetas. Último dígito par: aprobado; impar: denegado.</p>}
            <p>Productos: Q{Number(order.subtotal_antes_de_envio).toFixed(2)} · Envío: Q{Number(order.costo_envio).toFixed(2)}</p>
            <p className="text-2xl font-bold">Total confirmado: Q{Number(order.total).toFixed(2)}</p>
            {order.estado_de_pagado==='PENDIENTE'?<form onSubmit={e=>{e.preventDefault();void pay()}} className="space-y-4">
                <p className="text-sm">Reserva válida hasta {new Date(order.vence_en).toLocaleTimeString()}. Puedes cancelarla en Mis pedidos.</p>
                <label className="block">Número de tarjeta<input required autoComplete="off" inputMode="numeric" pattern="[0-9]{13,19}" maxLength={19} value={card.numeroTarjeta} onChange={e=>setCard({...card,numeroTarjeta:e.target.value.replace(/\D/g,'')})} className="mt-1 block w-full rounded border p-3"/></label>
                <label className="block">Titular<input required maxLength={150} autoComplete="off" value={card.titular} onChange={e=>setCard({...card,titular:e.target.value})} className="mt-1 block w-full rounded border p-3"/></label>
                <label className="block">Vencimiento (AAAAMM)<input required pattern="[0-9]{6}" maxLength={6} placeholder="202812" value={card.vencimiento} onChange={e=>setCard({...card,vencimiento:e.target.value})} className="mt-1 block w-full rounded border p-3"/></label>
                <label className="block">Código de seguridad<input required type="password" autoComplete="off" inputMode="numeric" pattern="[0-9]{3,4}" maxLength={4} value={card.seguridad} onChange={e=>setCard({...card,seguridad:e.target.value})} className="mt-1 block w-full rounded border p-3"/></label>
                <button disabled={busy} className="rounded bg-slate-950 px-6 py-3 text-white disabled:opacity-50">{busy?'Procesando…':`Confirmar pago de Q${Number(order.total).toFixed(2)}`}</button>
            </form>:<Link className="underline" to={`/orden/${order.id}`}>Ver resultado de la orden</Link>}
        </section>}
        <Link to="/pedidos" className="mr-6 underline">Mis pedidos</Link><Link to="/carrito" className="underline">Volver al carrito</Link>
    </main>
}
