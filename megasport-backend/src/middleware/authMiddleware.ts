import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from 'jsonwebtoken'
import type { AuthPayload, UserRole } from '../types/auth.js'
import { pool } from '../config/database.js'

export type AuthenticatedRequest = Request & {
    auth?: AuthPayload
}

function readBearerToken(req: Request): string | null {
    const authorization = req.header('authorization')
    if (!authorization?.startsWith('Bearer ')) {
        return null
    }

    return authorization.slice(7).trim() || null
}

export async function requireAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const token = readBearerToken(req)
    const secret = process.env.JWT_SECRET

    if (!token || !secret) {
        res.status(401).json({ message: 'Debes iniciar sesión' })
        return
    }

    try {
        const decoded = jwt.verify(token, secret, {
            issuer: 'megasport-api',
        }) as JwtPayload

        const userId = Number(decoded.sub)
        const role = decoded.role

        if (!Number.isInteger(userId) || (role !== 'CLIENTE' && role !== 'ADMINISTRADOR')) {
            throw new Error('Token inválido')
        }

        const account=await pool.query('SELECT rol,activo FROM usuario WHERE id=$1',[userId])
        if(!account.rows[0]?.activo) {
            res.status(401).json({message:'Cuenta inactiva o eliminada'})
            return
        }
        req.auth = { userId, role:account.rows[0].rol }
        next()
    } catch {
        res.status(401).json({ message: 'La sesión no es válida o ya venció' })
    }
}

export function requireRole(...roles: UserRole[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.auth || !roles.includes(req.auth.role)) {
            res.status(403).json({ message: 'No tienes permiso para realizar esta acción' })
            return
        }

        next()
    }
}
