import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {api} from '../services/api'
import type {PersistedOrder} from '../types/persistedOrder'
export default function Orders(){
    const [orders,setOrders]=useState<PersistedOrder[]>([])
    const [error,setError]=useState('')
    const [loading,setLoading]=useState(true)
    useEffect(()=>{let active=true;void api<PersistedOrder[]>('/ordenes').then(o=>{if(active)setOrders(o)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[])
    return <main className="mx-auto max-w-4xl space-y-5 px-6 py-12"><h1 className="text-3xl font-bold">Mis pedidos</h1>
        {loading&&<p>Cargando…</p>}{error&&<p role="alert">{error}</p>}
        {!loading&&!error&&!orders.length&&<p>Aún no tienes órdenes.</p>}
        {orders.map(o=><Link key={o.id} to={`/orden/${o.id}`} className="block rounded-xl border p-5">
            #{o.id} · {o.estado_de_pagado} · Q{Number(o.total).toFixed(2)} · {o.modo==='mock'?'PRUEBA':'REAL'}
        </Link>)}
    </main>
}
