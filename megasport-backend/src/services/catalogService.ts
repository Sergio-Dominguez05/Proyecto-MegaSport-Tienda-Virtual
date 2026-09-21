import {pool} from "../config/database.js"
import type { Category } from '../types/catalog.js'
import type { Product } from '../types/catalog.js'
import type { ProductVariant } from '../types/catalog.js'

function createSlug(value: string): string {
    return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim().replace(/\s+/g, '-')
}

export async function getCategories(): Promise<Category[]> {
    const result = await pool.query<{
        id: number
        nombre: string
    }>(`SELECT id, nombre FROM categoria ORDER BY id`)

    return result.rows.map((row) => ({
        id: row.id,
        nombre: row.nombre,
        slug: createSlug(row.nombre)
    }))  
}

type ProductDatabaseRow = {
    id: number
    nombre: string
    descripcion: string | null
    precio: string
    urlImg: string | null
    activo: boolean
    creadoEn: string
    categoriaId: number
    categoriaNombre: string
    variantes: ProductVariant[]
}

function mapProduct(row: ProductDatabaseRow): Product {
    return {
        id: row.id,
        nombre: row.nombre,
        descripcion: row.descripcion,
        precio: Number(row.precio),
        urlImg: row.urlImg,
        activo: row.activo,
        creadoEn: row.creadoEn,
        categoriaId: row.categoriaId,
        categoria: createSlug(row.categoriaNombre),
        categoriaNombre: row.categoriaNombre,
        variantes: row.variantes ?? []
    }
}

export async function getProducts( categoryName?: string):Promise<Product[]>{
    const result = await pool.query<ProductDatabaseRow>(
        `SELECT p.id, p.nombre, p.descripcion, p.precio, p.url_img AS "urlImg", p.activo, TO_CHAR(p.creado_en, 'YYYY-MM-DD"T"HH24:MI:SS')
            AS "creadoEn", c.id AS "categoriaId", c.nombre AS "categoriaNombre",
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'idVariante', v.id_variante,
                        'talla', v.talla,
                        'activo', v.activo,
                        'sku', v.sku,
                        'stock', v.stock,
                        'stockMinimo', v.stock_minimo,
                        'color', v.color
                    )
                    ORDER BY v.id_variante
                )
                FILTER(
                    WHERE v.id_variante IS NOT NULL
                ),

                '[]'::JSON
            ) AS variantes
            
            FROM producto p 
            INNER JOIN categoria c ON c.id = p.id_categoria
            LEFT JOIN variante_producto v ON v.id_producto = p.id AND v.activo = TRUE
            WHERE p.activo = TRUE AND ($1::TEXT IS NULL OR c.nombre = $1)
            GROUP BY p.id, p.nombre, p.descripcion, p.precio, p.url_img, p.activo, p.creado_en, c.id, c.nombre
            ORDER BY p.id;`,

            [categoryName ?? null,]
    )

    return result.rows.map(mapProduct)
}

export async function getProductById( id: number): Promise<Product | null>{
    const result = await pool.query<ProductDatabaseRow>(
        `SELECT p.id, p.nombre, p.descripcion, p.precio, p.url_img AS "urlImg", p.activo, TO_CHAR(p.creado_en, 'YYYY-MM-DD"T"HH24:MI:SS')
            AS "creadoEn", c.id AS "categoriaId", c.nombre AS "categoriaNombre", 
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'idVariante', v.id_variante,
                        'talla', v.talla,
                        'activo', v.activo,
                        'sku', v.sku,
                        'stock', v.stock,
                        'stockMinimo', v.stock_minimo,
                        'color', v.color
                    )
                    ORDER BY v.id_variante
                )
                FILTER(
                    WHERE v.id_variante IS NOT NULL    
                ),

                '[]'::JSON
            ) AS variantes
             
            FROM producto p
            INNER JOIN categoria c ON c.id = p.id_categoria
            LEFT JOIN variante_producto v ON v.id_producto = p.id AND v.activo = TRUE
            GROUP BY p.id, p.nombre, p.descripcion, p.precio, p.url_img, p.activo, p.creado_en, c.id, c.nombre
            WHERE p.id = $1 AND p.activo = TRUE;`,

            [id]

    )

    if (result.rows.length === 0){
        return null
    }

    return mapProduct(result.rows[0])
}