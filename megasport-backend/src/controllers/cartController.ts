import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js'
import { addCartItem, clearUserCart, getUserCart, removeCartItem, updateCartItem } from '../services/cartService.js'
import { HttpError } from '../utils/httpError.js'

function authenticatedUserId(req: AuthenticatedRequest): number {
    if (!req.auth) {
        throw new HttpError(401, 'Debes iniciar sesión')
    }
    return req.auth.userId
}

function positiveInteger(value: unknown, field: string): number {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new HttpError(400, `${field} debe ser un número entero mayor que cero`)
    }
    return parsed
}

function handleCartError(error: unknown, res: Response): void {
    if (error instanceof HttpError) {
        res.status(error.status).json({ message: error.message })
        return
    }
    console.error('Error de carrito:', error)
    res.status(500).json({ message: 'No se pudo procesar el carrito' })
}

export async function getCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        res.json(await getUserCart(authenticatedUserId(req)))
    } catch (error) {
        handleCartError(error, res)
    }
}

export async function addItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const variantId = positiveInteger(req.body.idVariante, 'idVariante')
        const quantity = positiveInteger(req.body.cantidad, 'cantidad')
        res.status(201).json(await addCartItem(authenticatedUserId(req), variantId, quantity))
    } catch (error) {
        handleCartError(error, res)
    }
}

export async function updateItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const variantId = positiveInteger(req.params.idVariante, 'idVariante')
        const quantity = positiveInteger(req.body.cantidad, 'cantidad')
        res.json(await updateCartItem(authenticatedUserId(req), variantId, quantity))
    } catch (error) {
        handleCartError(error, res)
    }
}

export async function removeItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const variantId = positiveInteger(req.params.idVariante, 'idVariante')
        res.json(await removeCartItem(authenticatedUserId(req), variantId))
    } catch (error) {
        handleCartError(error, res)
    }
}

export async function clearCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        res.json(await clearUserCart(authenticatedUserId(req)))
    } catch (error) {
        handleCartError(error, res)
    }
}
