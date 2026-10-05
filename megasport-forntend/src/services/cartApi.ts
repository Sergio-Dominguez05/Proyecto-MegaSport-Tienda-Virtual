import type { CartItem } from '../types/cart'

const API_URL = import.meta.env.VITE_API_URL

type CartResponse = {
    idCarrito: number
    items: CartItem[]
}

async function requestCart(token: string, path = '', init?: RequestInit): Promise<CartResponse> {
    const response = await fetch(`${API_URL}/carrito${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...init?.headers,
        },
    })
    const data = await response.json() as CartResponse & { message?: string }
    if (!response.ok) {
        throw new Error(data.message ?? 'No se pudo actualizar el carrito')
    }
    return data
}

export function getCart(token: string): Promise<CartResponse> {
    return requestCart(token)
}

export function addCartItem(token: string, idVariante: number, cantidad: number): Promise<CartResponse> {
    return requestCart(token, '/articulos', {
        method: 'POST',
        body: JSON.stringify({ idVariante, cantidad }),
    })
}

export function updateCartItem(token: string, idVariante: number, cantidad: number): Promise<CartResponse> {
    return requestCart(token, `/articulos/${idVariante}`, {
        method: 'PATCH',
        body: JSON.stringify({ cantidad }),
    })
}

export function removeCartItem(token: string, idVariante: number): Promise<CartResponse> {
    return requestCart(token, `/articulos/${idVariante}`, { method: 'DELETE' })
}

export function clearCart(token: string): Promise<CartResponse> {
    return requestCart(token, '', { method: 'DELETE' })
}
