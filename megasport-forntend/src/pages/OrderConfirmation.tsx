import {useEffect,useState} from 'react'
import {Link,useParams} from 'react-router-dom'
import {api} from '../services/api'
import type {PersistedOrder} from '../types/persistedOrder'
import {SHIPPING_STATUS_LABELS} from '../types/courier'
import {useCart} from '../context/CartContext'

export default function OrderConfirmation(){
    const allowUnsafeRetry=import.meta.env.VITE_ALLOW_UNSAFE_INTEGRATION_RETRY==='true'
    const {id}=useParams()
    const [order,setOrder]=useState<PersistedOrder|null>(null)
    const [error,setError]=useState('')
    const [busy,setBusy]=useState(false)
    const [card,setCard]=useState({numeroTarjeta:'',titular:'',vencimiento:'',seguridad:''})
    const {refreshCart}=useCart()

    useEffect(()=>{
        let cancelled=false
        void api<PersistedOrder>(`/ordenes/${id}`).then(o=>{if(!cancelled)setOrder(o)}).catch(e=>{if(!cancelled)setError(e.message)})
        return()=>{cancelled=true}
    },[id])

    useEffect(()=>{void refreshCart().catch(()=>{})},[refreshCart])

    async function action(name:string){
        setBusy(true);setError('')
        try{setOrder(await api<PersistedOrder>(`/ordenes/${id}/${name}`,'POST'));await refreshCart()}
        catch(e){setError(e instanceof Error?e.message:'No se pudo actualizar')}
        finally{setBusy(false)}
    }

    async function retryPayment(){
        if(!order||busy)return
        setBusy(true);setError('')
        try{
            const updated=await api<PersistedOrder>(`/ordenes/${order.id}/pagar`,'POST',card)
            setOrder(updated)
            if(updated.estado_de_pagado!=='REVISION'){
                setCard({numeroTarjeta:'',titular:'',vencimiento:'',seguridad:''})
            }
            await refreshCart()
        }catch(e){
            setError(e instanceof Error?e.message:'No se pudo reintentar la autorización')
        }finally{
            setBusy(false)
        }
    }

    return <main className="mx-auto max-w-4xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-bold">Orden #{id}</h1>
        {error&&<p role="alert" className="rounded bg-red-50 p-4 text-red-700">{error}</p>}
        {!order&&!error&&<p>Cargando…</p>}
        {order&&<>
            <section className="space-y-3 rounded-2xl border p-6">
                {order.modo==='mock'&&<p className="font-semibold text-amber-700">Compra de prueba: no se realizó ningún cobro real.</p>}
                <p>Pago: <strong>{order.estado_de_pagado}</strong></p><p>Envío: {order.envio_proceso}</p>
                {order.nota_revision&&<p className="rounded bg-amber-50 p-3">{order.nota_revision}</p>}
                {order.num_autorizacion&&<p>Autorización: {order.num_autorizacion}</p>}
                {order.num_envio&&<p>Referencia courier: {order.num_envio} · {SHIPPING_STATUS_LABELS[order.estado_envio]}</p>}

                {order.estado_de_pagado==='PENDIENTE'&&<><p>Compra pendiente. Cancélala para liberar el stock y volver a preparar el pago.</p><button disabled={busy} onClick={()=>void action('cancelar')} className="rounded border px-4 py-2">Cancelar y liberar stock</button></>}

                {order.estado_de_pagado==='REVISION'&&!allowUnsafeRetry&&<p>No intentes pagar otra vez. Se debe verificar el resultado con el emisor.</p>}

                {order.estado_de_pagado==='REVISION'&&allowUnsafeRetry&&<form onSubmit={e=>{e.preventDefault();void retryPayment()}} className="space-y-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                    <p className="font-semibold text-amber-900">Reintento manual de autorización — solo para pruebas de integración.</p>
                    <p className="text-sm text-amber-800">En un entorno real no se debe repetir un cobro cuando la respuesta anterior fue incierta, porque el emisor pudo haberlo procesado.</p>
                    <label className="block">Número de tarjeta<input required autoComplete="off" inputMode="numeric" pattern="[0-9]{13,19}" maxLength={19} value={card.numeroTarjeta} onChange={e=>setCard({...card,numeroTarjeta:e.target.value.replace(/\D/g,'')})} className="mt-1 block w-full rounded border bg-white p-3"/></label>
                    <label className="block">Titular<input required maxLength={150} autoComplete="off" value={card.titular} onChange={e=>setCard({...card,titular:e.target.value})} className="mt-1 block w-full rounded border bg-white p-3"/></label>
                    <label className="block">Vencimiento (AAAAMM)<input required pattern="[0-9]{6}" maxLength={6} placeholder="202812" value={card.vencimiento} onChange={e=>setCard({...card,vencimiento:e.target.value.replace(/\D/g,'')})} className="mt-1 block w-full rounded border bg-white p-3"/></label>
                    <label className="block">Código de seguridad<input required type="password" autoComplete="off" inputMode="numeric" pattern="[0-9]{3,4}" maxLength={4} value={card.seguridad} onChange={e=>setCard({...card,seguridad:e.target.value.replace(/\D/g,'')})} className="mt-1 block w-full rounded border bg-white p-3"/></label>
                    <button disabled={busy} className="rounded bg-amber-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy?'Reintentando…':'Reintentar autorización'}</button>
                </form>}

                {order.estado_de_pagado==='APROBADO'&&order.envio_proceso==='PENDIENTE'&&<button disabled={busy} onClick={()=>void action('enviar')} className="rounded bg-slate-950 px-5 py-3 text-white">Solicitar envío (sin volver a cobrar)</button>}

                {order.estado_de_pagado==='APROBADO'&&order.envio_proceso==='REVISION'&&!allowUnsafeRetry&&<p>El envío requiere revisión antes de volver a enviarlo.</p>}

                {order.estado_de_pagado==='APROBADO'&&order.envio_proceso==='REVISION'&&allowUnsafeRetry&&<div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
                    <p className="font-semibold text-amber-900">La confirmación del courier no fue válida o no llegó a tiempo.</p>
                    <p className="text-sm text-amber-800">Solo para las pruebas de integración puedes volver a enviar la solicitud. En producción esto podría crear un envío duplicado.</p>
                    <button disabled={busy} onClick={()=>void action('enviar')} className="rounded bg-amber-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy?'Reintentando…':'Reintentar solicitud de envío'}</button>
                </div>}

                {order.envio_proceso==='CREADO'&&<button disabled={busy} onClick={()=>void action('rastrear')} className="rounded border px-4 py-2">{busy?'Consultando…':'Actualizar seguimiento'}</button>}
                {order.envio_proceso==='PROCESANDO'&&<p>Solicitud en proceso. La integración corta la espera a los 5 segundos; después recarga la orden para ver el resultado.</p>}
                <p>{order.destinatario} · {order.direccion_de_envio} · {order.codigo_del_destino}</p>
            </section>
            <section className="rounded-2xl border p-6"><h2 className="mb-4 text-xl font-bold">Productos comprados</h2>
                {order.detalles.map(d=><p key={d.id} className="border-b py-3">{d.nombre_producto} · {d.talla}/{d.color} · {d.cantidad_de_articulos} × Q{Number(d.precio_por_unidad).toFixed(2)}</p>)}
                <p className="mt-5 text-xl font-bold">Total: Q{Number(order.total).toFixed(2)}</p>
            </section>
        </>}
        <Link className="mr-6 underline" to="/pedidos">Mis pedidos</Link><Link className="underline" to="/">Seguir comprando</Link>
    </main>
}
