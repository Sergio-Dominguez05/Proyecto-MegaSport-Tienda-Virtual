import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js'
import { getUserById, loginUser, registerUser } from '../services/authService.js'
import { HttpError } from '../utils/httpError.js'

function requiredString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : ''
}

function handleAuthError(error: unknown, res: Response): void {
    if (error instanceof HttpError) {
        res.status(error.status).json({ message: error.message })
        return
    }

    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        res.status(409).json({ message: 'Ya existe una cuenta con ese correo' })
        return
    }

    console.error('Error de autenticación:', error)
    res.status(500).json({ message: 'Ocurrió un error al procesar la autenticación' })
}

export async function register(req: Request, res: Response): Promise<void> {
    const nombre = requiredString(req.body.nombre)
    const email = requiredString(req.body.email)
    const password = requiredString(req.body.password)
    const direccion = requiredString(req.body.direccion)
    const codigoDestino = requiredString(req.body.codigoDestino)
    const telefono = requiredString(req.body.telefono)

    if (nombre.length < 3 || nombre.length > 150) {
        res.status(400).json({ message: 'El nombre debe tener entre 3 y 150 caracteres' })
        return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        res.status(400).json({ message: 'El correo no es válido' })
        return
    }
    if (password.length < 8 || password.length > 72) {
        res.status(400).json({ message: 'La contraseña debe tener entre 8 y 72 caracteres' })
        return
    }
    if (direccion.length < 6 || direccion.length > 300) {
        res.status(400).json({ message: 'La dirección debe tener entre 6 y 300 caracteres' })
        return
    }
    if (!/^\d{5}$/.test(codigoDestino)) {
        res.status(400).json({ message: 'El código de destino debe contener exactamente 5 dígitos' })
        return
    }
    if (!/^[0-9+()\-\s]{8,25}$/.test(telefono)) {
        res.status(400).json({ message: 'El teléfono no es válido' })
        return
    }

    try {
        const result = await registerUser({
            nombre,
            email,
            password,
            direccion,
            codigoDestino,
            telefono,
        })
        res.status(201).json(result)
    } catch (error) {
        handleAuthError(error, res)
    }
}

export async function login(req: Request, res: Response): Promise<void> {
    const email = requiredString(req.body.email)
    const password = requiredString(req.body.password)

    if (!email || !password) {
        res.status(400).json({ message: 'Correo y contraseña son obligatorios' })
        return
    }

    try {
        res.json(await loginUser({ email, password }))
    } catch (error) {
        handleAuthError(error, res)
    }
}

export async function profile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.auth) {
        res.status(401).json({ message: 'Debes iniciar sesión' })
        return
    }

    try {
        const user = await getUserById(req.auth.userId)
        if (!user) {
            res.status(404).json({ message: 'El usuario ya no existe' })
            return
        }

        res.json({ user })
    } catch (error) {
        handleAuthError(error, res)
    }
}

export function adminAccess(_req: AuthenticatedRequest, res: Response): void {
    res.json({ message: 'Acceso de administrador autorizado' })
}
