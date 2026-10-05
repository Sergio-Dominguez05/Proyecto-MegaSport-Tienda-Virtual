import type { PoolClient } from 'pg'
import { pool } from '../config/database.js'
import type { Cart, CartItem } from '../types/cart.js'
import { HttpError } from '../utils/httpError.js'
import { transaction } from '../utils/transaction.js'
import { intField } from '../utils/validation.js'

export async function mergeGuestCart(userId:number,items:unknown) {
    if(!Array.isArray(items)||items.length>100) throw new HttpError(400,'Carrito invitado inválido')
    return transaction(async client=>{
        await editable(client,userId)
        const cartId=await getOrCreateCart(client,userId)
        for(const item of items){
            const id=intField(item?.idVariante,'variante'),quantity=intField(item?.cantidad,'cantidad')
            const variant=await requireAvailableVariant(client,id)
            if(quantity>variant.stock) throw new HttpError(409,`Solo hay ${variant.stock} unidades disponibles`)
            // Fusión idempotente: conserva la mayor cantidad, sin sumar dos veces al reintentar.
            await client.query(`INSERT INTO articulo_en_carrito(id_carrito,id_variante,cantidad) VALUES($1,$2,$3)
                ON CONFLICT(id_carrito,id_variante) DO UPDATE SET cantidad=GREATEST(articulo_en_carrito.cantidad,EXCLUDED.cantidad)`,[cartId,id,quantity])
        }
        return readCart(client,cartId)
    })
}

type VariantRow = {
    stock: number
    activo: boolean
    producto_activo: boolean
}

async function getOrCreateCart(client: PoolClient, userId: number): Promise<number> {
    await client.query('SELECT id FROM usuario WHERE id=$1 FOR UPDATE',[userId])
    const current = await client.query<{ id: number }>(
        `SELECT id FROM carrito WHERE id_usuario = $1 ORDER BY creado_en DESC, id DESC LIMIT 1 FOR UPDATE`,
        [userId],
    )

    if (current.rows[0]) {
        return current.rows[0].id
    }

    const created = await client.query<{ id: number }>(
        `INSERT INTO carrito (id_usuario) VALUES ($1) RETURNING id`,
        [userId],
    )

    return created.rows[0]!.id
}

async function editable(client:PoolClient,userId:number) {
    await client.query('SELECT id FROM usuario WHERE id=$1 FOR UPDATE',[userId])
    const active=await client.query("SELECT id FROM orden WHERE id_usuario=$1 AND estado_de_pagado IN ('PENDIENTE','PROCESANDO','REVISION')",[userId])
    if(active.rows.length) throw new HttpError(409, 'Tienes una orden pendiente. Complétala o cancélala en Mis pedidos antes de cambiar el carrito.')
}

async function readCart(client: PoolClient, cartId: number): Promise<Cart> {
    const result = await client.query<CartItem>(
        `SELECT id_item AS "idItem", id_variante AS "idVariante", cantidad
         FROM articulo_en_carrito
         WHERE id_carrito = $1
         ORDER BY id_item`,
        [cartId],
    )

    return { idCarrito: cartId, items: result.rows }
}

async function requireAvailableVariant(client: PoolClient, variantId: number): Promise<VariantRow> {
    const result = await client.query<VariantRow>(
        `SELECT v.stock, v.activo, p.activo AS producto_activo
         FROM variante_producto v
         INNER JOIN producto p ON p.id = v.id_producto
         WHERE v.id_variante = $1
         FOR SHARE OF v, p`,
        [variantId],
    )
    const variant = result.rows[0]

    if (!variant || !variant.activo || !variant.producto_activo) {
        throw new HttpError(404, 'La variante seleccionada no está disponible')
    }

    return variant
}

export async function getUserCart(userId: number): Promise<Cart> {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const cartId = await getOrCreateCart(client, userId)
        const cart = await readCart(client, cartId)
        await client.query('COMMIT')
        return cart
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

export async function addCartItem(userId: number, variantId: number, quantity: number): Promise<Cart> {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        await editable(client,userId)
        const cartId = await getOrCreateCart(client, userId)
        const variant = await requireAvailableVariant(client, variantId)
        const current = await client.query<{ cantidad: number }>(
            `SELECT cantidad FROM articulo_en_carrito
             WHERE id_carrito = $1 AND id_variante = $2
             FOR UPDATE`,
            [cartId, variantId],
        )
        const nextQuantity = (current.rows[0]?.cantidad ?? 0) + quantity

        if (nextQuantity > variant.stock) {
            throw new HttpError(409, `Solo hay ${variant.stock} unidades disponibles`)
        }

        await client.query(
            `INSERT INTO articulo_en_carrito (id_carrito, id_variante, cantidad)
             VALUES ($1, $2, $3)
             ON CONFLICT (id_carrito, id_variante)
             DO UPDATE SET cantidad = EXCLUDED.cantidad`,
            [cartId, variantId, nextQuantity],
        )

        const cart = await readCart(client, cartId)
        await client.query('COMMIT')
        return cart
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

export async function updateCartItem(userId: number, variantId: number, quantity: number): Promise<Cart> {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        await editable(client,userId)
        const cartId = await getOrCreateCart(client, userId)
        const variant = await requireAvailableVariant(client, variantId)

        if (quantity > variant.stock) {
            throw new HttpError(409, `Solo hay ${variant.stock} unidades disponibles`)
        }

        const updated = await client.query(
            `UPDATE articulo_en_carrito SET cantidad = $1
             WHERE id_carrito = $2 AND id_variante = $3`,
            [quantity, cartId, variantId],
        )
        if (updated.rowCount === 0) {
            throw new HttpError(404, 'El artículo no está en el carrito')
        }

        const cart = await readCart(client, cartId)
        await client.query('COMMIT')
        return cart
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

export async function removeCartItem(userId: number, variantId: number): Promise<Cart> {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        await editable(client,userId)
        const cartId = await getOrCreateCart(client, userId)
        await client.query(
            `DELETE FROM articulo_en_carrito WHERE id_carrito = $1 AND id_variante = $2`,
            [cartId, variantId],
        )
        const cart = await readCart(client, cartId)
        await client.query('COMMIT')
        return cart
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

export async function clearUserCart(userId: number): Promise<Cart> {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        await editable(client,userId)
        const cartId = await getOrCreateCart(client, userId)
        await client.query(`DELETE FROM articulo_en_carrito WHERE id_carrito = $1`, [cartId])
        await client.query('COMMIT')
        return { idCarrito: cartId, items: [] }
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}
