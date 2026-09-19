export type ProductVariant = {
    idVariante: number
    talla: string
    color: string
    sku: string
    stock: number
    stockMinimo: number
    activo: boolean
}

export type Product = {
    id: number
    nombre: string
    descripcion: string
    precio: number
    urlImg: string
    activo: boolean
    creadoEn: string
    categoria: string
    variantes: ProductVariant[]
}