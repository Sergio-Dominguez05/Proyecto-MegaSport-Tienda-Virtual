import {useEffect,useState} from 'react'
import {Link,useParams} from 'react-router-dom'
import {api} from '../services/api'
import type {PersistedOrder} from '../types/persistedOrder'
import {SHIPPING_STATUS_LABELS} from '../types/courier'
import {useCart} from '../context/CartContext'
export default function OrderConfirmation(){
    const {id}=useParams()
    const [order,setOrder]=useState<PersistedOrder|null>(null)
    const [error,setError]=useState('')
    const [busy,setBusy]=useState(false)
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
    return <main className="mx-auto max-w-4xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-bold">Orden #{id}</h1>
        {error&&<p role="alert" className="rounded bg-red-50 p-4 text-red-700">{error}</p>}
        {!order&&!error&&<p>Cargando…</p>}
        {order&&<>
            <section className="space-y-3 rounded-2xl border p-6">
                {order.modo==='mock'&&<p className="font-semibold text-amber-700">Compra de prueba: no se realizó ningún cobro real.</p>}
                <p>Pago: <strong>{order.estado_de_pagado}</strong></p><p>Envío: {order.envio_proceso}</p>
                {order.nota_revision&&<p className="rounded bg-amber-50 p-3">{order.nota_revision}</p>}
                {['PROCESANDO','REVISION'].includes(order.estado_de_pagado)&&<p>No intentes pagar otra vez. Se debe verificar el resultado con el emisor.</p>}
                {order.num_autorizacion&&<p>Autorización: {order.num_autorizacion}</p>}
                {order.num_envio&&<p>Referencia courier: {order.num_envio} · {SHIPPING_STATUS_LABELS[order.estado_envio]}</p>}
                {order.estado_de_pagado==='PENDIENTE'&&<><p>Compra pendiente. Cancélala para liberar el stock y volver a preparar el pago.</p><button disabled={busy} onClick={()=>void action('cancelar')} className="rounded border px-4 py-2">Cancelar y liberar stock</button></>}
                {order.estado_de_pagado==='APROBADO'&&order.envio_proceso==='PENDIENTE'&&<button disabled={busy} onClick={()=>void action('enviar')} className="rounded bg-slate-950 px-5 py-3 text-white">Solicitar envío (sin volver a cobrar)</button>}
                {order.envio_proceso==='CREADO'&&<button disabled={busy} onClick={()=>void action('rastrear')} className="rounded border px-4 py-2">Actualizar seguimiento</button>}
                {order.envio_proceso==='PROCESANDO'&&<p>Solicitud en proceso. Si no cambia al recargar, solicita revisión al administrador.</p>}
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
