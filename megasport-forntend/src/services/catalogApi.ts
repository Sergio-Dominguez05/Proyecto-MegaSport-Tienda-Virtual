import type { Category } from "../types/catalog";
import type { Product } from "../types/catalog";

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL){
    throw new Error('la api no esta bien definida')
}

export async function getCategories(): Promise<Category[]>{
    const response = await fetch(`${API_URL}/categorias`)
    if(!response.ok){
        throw new Error('Hubo un error cuando se quiso obtener las categorias')
    }

    const categories:Category[] = await response.json()

    return categories
}

export async function getProducts(category?: string): Promise<Product[]>{
    let url = `${API_URL}/productos`
    if (category) {
        url += `?categoria=${encodeURIComponent(category)}`
    }
    const response = await fetch(url)

    if(!response.ok){
        throw new Error('Error intentando obtener los productos')
    }

    const products: Product[] = await response.json()

    return products
}

export async function getProductById(id: number): Promise<Product | null> {
    const response = await fetch(`${API_URL}/productos/${id}`)

    if (response.status === 404){
        return null
    }

    if (!response.ok){
        throw new Error('No se pudo encontrar el producto')
    }

    const product : Product = await response.json()

    return product
}