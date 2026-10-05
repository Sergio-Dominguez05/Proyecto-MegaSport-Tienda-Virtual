import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import { pool } from '../config/database.js'
import type {
    AuthResult,
    LoginInput,
    PublicUser,
    RegisterInput,
    UserRole,
} from '../types/auth.js'
import { HttpError } from '../utils/httpError.js'

type UserDatabaseRow = {
    activo?: boolean
    id: number
    hash_contrasena: string
    rol: UserRole
    direccion: string
    codigoDestino: string
    telefono: string
    creadoEn: string
    nombre: string
    email: string
}

const PASSWORD_ROUNDS = 12

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET

    if (!secret || secret.length < 32) {
        throw new Error('JWT_SECRET debe existir y tener al menos 32 caracteres')
    }

    return secret
}

function mapPublicUser(row: UserDatabaseRow): PublicUser {
    return {
        id: row.id,
        nombre: row.nombre,
        email: row.email,
        rol: row.rol,
        direccion: row.direccion,
        codigoDestino: row.codigoDestino,
        telefono: row.telefono,
        creadoEn: row.creadoEn,
    }
}

function createToken(user: PublicUser): string {
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? '8h') as NonNullable<SignOptions['expiresIn']>
    const options: SignOptions = {
        subject: String(user.id),
        expiresIn,
        issuer: 'megasport-api',
    }

    return jwt.sign(
        { role: user.rol },
        getJwtSecret(),
        options,
    )
}

async function findUserByEmail(email: string): Promise<UserDatabaseRow | null> {
    const result = await pool.query<UserDatabaseRow>(
        `SELECT
            id,
            activo,
            hash_contrasena,
            rol,
            direccion,
            codigo_de_destino AS "codigoDestino",
            telefono,
            TO_CHAR(creado_en, 'YYYY-MM-DD"T"HH24:MI:SS') AS "creadoEn",
            nombre,
            email
        FROM usuario
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1`,
        [email],
    )

    return result.rows[0] ?? null
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase()

    if (await findUserByEmail(email)) {
        throw new HttpError(409, 'Ya existe una cuenta con ese correo')
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_ROUNDS)

    const result = await pool.query<UserDatabaseRow>(
        `INSERT INTO usuario (
            hash_contrasena,
            rol,
            direccion,
            codigo_de_destino,
            telefono,
            nombre,
            email
        )
        VALUES ($1, 'CLIENTE', $2, $3, $4, $5, $6)
        RETURNING
            id,
            hash_contrasena,
            rol,
            direccion,
            codigo_de_destino AS "codigoDestino",
            telefono,
            TO_CHAR(creado_en, 'YYYY-MM-DD"T"HH24:MI:SS') AS "creadoEn",
            nombre,
            email`,
        [
            passwordHash,
            input.direccion.trim(),
            input.codigoDestino.trim(),
            input.telefono.trim(),
            input.nombre.trim(),
            email,
        ],
    )

    const row = result.rows[0]
    if (!row) {
        throw new Error('No fue posible crear el usuario')
    }

    const user = mapPublicUser(row)
    return { token: createToken(user), user }
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
    const row = await findUserByEmail(input.email.trim())

    if (!row || row.activo===false || row.hash_contrasena === 'PENDIENTE_HASH_BACKEND') {
        throw new HttpError(401, 'Correo o contraseña incorrectos')
    }

    const passwordMatches = await bcrypt.compare(input.password, row.hash_contrasena)
    if (!passwordMatches) {
        throw new HttpError(401, 'Correo o contraseña incorrectos')
    }

    const user = mapPublicUser(row)
    return { token: createToken(user), user }
}

export async function getUserById(id: number): Promise<PublicUser | null> {
    const result = await pool.query<UserDatabaseRow>(
        `SELECT
            id,
            hash_contrasena,
            rol,
            direccion,
            codigo_de_destino AS "codigoDestino",
            telefono,
            TO_CHAR(creado_en, 'YYYY-MM-DD"T"HH24:MI:SS') AS "creadoEn",
            nombre,
            email
        FROM usuario
        WHERE id = $1
        LIMIT 1`,
        [id],
    )

    const row = result.rows[0]
    return row ? mapPublicUser(row) : null
}
