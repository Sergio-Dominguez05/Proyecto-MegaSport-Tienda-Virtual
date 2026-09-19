import { createContext } from "react";
import { useContext } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";
import type { ReactNode } from "react";
import type { CartItem } from "../types/cart";

type CartContextType = {
    items: CartItem[]

    addItem: (
        idVariante: number,
        cantidad: number,
        stockDisponible: number
    ) => void

    updateQuantity: (
        idVariante: number,
        nuevaCantidad: number,
        stockDisponible: number
    ) => void

    removeItem: (
        idVariante: number
    ) => void

    clearCart: (

    ) => void

    totalItems: number
}


const CartContext = createContext<CartContextType | undefined>(
    undefined
)

type CartProviderProps = {
    children: ReactNode
}

function CartProvider({ children }: CartProviderProps){
    const [items, setItems] = useState<CartItem[]>(() => {
        const savedCart = localStorage.getItem('megasport-cart')
        if (!savedCart) {
            return []
        }

        try {
            return JSON.parse(savedCart)
        } catch {
            return[]
        }
    })

    useEffect(() => {
        localStorage.setItem(
            'megasport-cart',
            JSON.stringify(items)
        )
    }, [items])

    const addItem = (
        idVariante: number,
        cantidad: number,
        stockDisponible: number
    ) => {
        if (cantidad <= 0 || stockDisponible <= 0){
            return
        }

        setItems((currentItems) => {
            const existingItem = currentItems.find(
                (item) => item.idVariante === idVariante
            )

            if (existingItem){
                return currentItems.map((item) => {
                    if (item.idVariante !== idVariante){
                        return item
                    }

                    return{
                        ...item,
                        cantidad:Math.min(
                            item.cantidad + cantidad,
                            stockDisponible
                        ),
                    }
                })
            }

            return [
                ...currentItems,
                {
                    idVariante,
                    cantidad: Math.min(
                        cantidad,
                        stockDisponible
                    ),
                },
            ]
        })
    }
    const updateQuantity = (
        idVariante: number,
        nuevaCantidad: number,
        stockDisponible: number
    ) => {
        if (nuevaCantidad <= 0) {
            removeItem(idVariante)
            return
        }
        setItems((currentItems) => currentItems.map((item) => {
            if (item.idVariante !== idVariante){
                return item
            }

            return{
                ...item,
                cantidad: Math.min(
                    nuevaCantidad,
                    stockDisponible
                ),
            }
        }))
    }

    const removeItem = (idVariante: number) => {
        setItems((currentItems) => currentItems.filter((item) => item.idVariante !== idVariante))
    }

    const clearCart = () => {
        setItems([])
    }

    const totalItems = useMemo(() => {
        return items.reduce(
            (total, item) => total + item.cantidad, 0
        )
    }, [items])

    return (

        <CartContext.Provider
            value={{
                items,
                addItem,
                updateQuantity,
                removeItem,
                clearCart,
                totalItems,
            }}>

                {children}

        </CartContext.Provider>
    )
}

function useCart (){
    const context = useContext(CartContext)

    if(!context){
        throw new Error(
            'Se jodio algo porque el programa no esta usando el useCart dentro del cartProvider'
        )
    }
    return context
}

export {
    CartProvider,
    useCart
}