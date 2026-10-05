export type UserRole = 'ADMINISTRADOR' | 'CLIENTE'

export type PublicUser = {
    id: number
    nombre: string
    email: string
    rol: UserRole
    direccion: string
    codigoDestino: string
    telefono: string
    creadoEn: string
}

export type RegisterInput = {
    nombre: string
    email: string
    password: string
    direccion: string
    codigoDestino: string
    telefono: string
}

export type LoginInput = {
    email: string
    password: string
}

export type AuthResult = {
    token: string
    user: PublicUser
}

export type AuthPayload = {
    userId: number
    role: UserRole
}
