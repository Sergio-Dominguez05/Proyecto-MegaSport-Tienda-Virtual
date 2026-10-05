/* eslint-disable react-refresh/only-export-components */
import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react'
import type {ReactNode} from 'react'
import {useAuth} from '../hooks/useAuth'
import type {CartItem} from '../types/cart'
import {api} from '../services/api'
type Value={
    items:CartItem[];totalItems:number;loading:boolean;error:string|null
    addItem:(id:number,qty:number,stock:number)=>Promise<void>
    updateQuantity:(id:number,qty:number,stock:number)=>Promise<void>
    removeItem:(id:number)=>Promise<void>;clearCart:()=>Promise<void>;refreshCart:()=>Promise<void>
}
type Remote={items:CartItem[]}
const Context=createContext<Value|null>(null)
const GUEST='megasport-cart'
function guestItems():CartItem[]{
    try{
        const data:unknown=JSON.parse(localStorage.getItem(GUEST)??'[]')
        return Array.isArray(data)?data.filter(i=>Number.isInteger(i?.idVariante)&&i.idVariante>0&&Number.isInteger(i?.cantidad)&&i.cantidad>0):[]
    }catch{return[]}
}
export function CartProvider({children}:{children:ReactNode}){
    const {token,loading}=useAuth()
    return <CartSession key={token??'guest'} authenticated={Boolean(token)} authLoading={loading}>{children}</CartSession>
}
function CartSession({children,authenticated,authLoading}:{children:ReactNode;authenticated:boolean;authLoading:boolean}){
    const [items,setItems]=useState<CartItem[]>(()=>authenticated?[]:guestItems())
    const [loading,setLoading]=useState(authenticated)
    const [error,setError]=useState<string|null>(null)
    const queue=useRef<Promise<void>>(Promise.resolve())
    const refreshCart=useCallback(async()=>{
        if(authenticated){const cart=await api<Remote>('/carrito');setItems(cart.items)}
    },[authenticated])
    useEffect(()=>{
        if(!authenticated) return
        let active=true
        async function load(){
            let mergeError:string|null=null
            const guest=guestItems()
            if(guest.length){
                try{await api('/carrito/fusionar','POST',{items:guest});localStorage.removeItem(GUEST)}
                catch(e){mergeError=e instanceof Error?e.message:'No se pudo importar el carrito invitado'}
            }
            try{const cart=await api<Remote>('/carrito');if(active){setItems(cart.items);setError(mergeError)}}
            catch(e){if(active)setError(e instanceof Error?e.message:'Error de conexión')}
            finally{if(active)setLoading(false)}
        }
        const pending=load()
        queue.current=pending
        return()=>{active=false}
    },[authenticated])
    useEffect(()=>{if(!authenticated)localStorage.setItem(GUEST,JSON.stringify(items))},[items,authenticated])
    function mutate(path:string,method:string,body:unknown,local:(items:CartItem[])=>CartItem[]){
        if(!authenticated){setItems(local);return Promise.resolve()}
        const next=queue.current.catch(()=>{}).then(async()=>{
            setError(null)
            try{const cart=await api<Remote>(path,method,body);setItems(cart.items)}
            catch(e){setError(e instanceof Error?e.message:'No se pudo actualizar');throw e}
        })
        queue.current=next
        return next
    }
    function removeItem(id:number){return mutate(`/carrito/articulos/${id}`,'DELETE',undefined,list=>list.filter(i=>i.idVariante!==id))}
    return <Context.Provider value={{
        items,totalItems:items.reduce((n,i)=>n+i.cantidad,0),loading:loading||authLoading,error,refreshCart,
        addItem:(id,qty,stock)=>mutate('/carrito/articulos','POST',{idVariante:id,cantidad:qty},list=>{
            const old=list.find(i=>i.idVariante===id)
            return old?list.map(i=>i.idVariante===id?{...i,cantidad:Math.min(stock,i.cantidad+qty)}:i):[...list,{idVariante:id,cantidad:Math.min(stock,qty)}]
        }),
        updateQuantity:(id,qty,stock)=>qty<=0?removeItem(id):mutate(`/carrito/articulos/${id}`,'PATCH',{cantidad:qty},list=>list.map(i=>i.idVariante===id?{...i,cantidad:Math.min(qty,stock)}:i)),
        removeItem,clearCart:()=>mutate('/carrito','DELETE',undefined,()=>[])
    }}>{children}</Context.Provider>
}
export function useCart(){const c=useContext(Context);if(!c)throw new Error('Falta CartProvider');return c}
