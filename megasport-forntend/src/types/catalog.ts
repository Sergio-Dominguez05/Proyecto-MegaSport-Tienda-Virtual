export type Category = {
    id: number
    nombre: string
    slug: string
}

export type ProductVariant = {
    idVariante: number
    talla: string
    activo: boolean
    sku: string
    stock: number
    stockMinimo: number
    color: string
}

export type Product = {
    id: number
    nombre: string
    descripcion: string | null
    precio: number
    urlImg: string | null
    activo: boolean
    creadoEn: string
    categoriaId: number
    categoria: string
    categoriaNombre: string
    variantes: ProductVariant[]
}