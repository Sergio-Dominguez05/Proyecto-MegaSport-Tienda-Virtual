import {useEffect,useState} from 'react'
import {NavLink} from 'react-router-dom'
import {useAuth} from '../hooks/useAuth'
import {useCart} from '../context/CartContext'
import {getCategories} from '../services/catalogApi'
import type {Category} from '../types/catalog'
export default function Navbar(){
    const {user,logout}=useAuth()
    const {totalItems}=useCart()
    const [categories,setCategories]=useState<Category[]>([])
    useEffect(()=>{
        const load=()=>{void getCategories().then(setCategories).catch(()=>{})}
        load();window.addEventListener('focus',load)
        return()=>window.removeEventListener('focus',load)
    },[])
    return <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-6 py-4">
            <NavLink to="/" className="text-2xl font-bold">MEGASPORT</NavLink>
            <nav className="flex flex-wrap items-center gap-4 text-sm">
                <NavLink to="/">Inicio</NavLink>
                {categories.map(c=><NavLink key={c.id} to={`/categoria/${c.slug}`}>{c.nombre}</NavLink>)}
                <NavLink to="/carrito">Carrito ({totalItems})</NavLink>
                {user?<><NavLink to="/pedidos">Mis pedidos</NavLink>
                    {user.rol==='ADMINISTRADOR'&&<NavLink to="/admin">Administración</NavLink>}
                    <span>{user.nombre}</span><button onClick={logout}>Salir</button>
                </>:<NavLink to="/login" className="rounded bg-slate-950 px-4 py-2 text-white">Ingresar</NavLink>}
            </nav>
        </div>
    </header>
}
