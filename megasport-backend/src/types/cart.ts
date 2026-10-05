export type CartItem = {
    idItem: number
    idVariante: number
    cantidad: number
}

export type Cart = {
    idCarrito: number
    items: CartItem[]
}
