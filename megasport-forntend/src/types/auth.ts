export type UserRole = 'ADMINISTRADOR' | 'CLIENTE'

export type User = {
    id: number
    nombre: string
    email: string
    rol: UserRole
    direccion: string
    codigoDestino: string
    telefono: string
    creadoEn: string
}

export type RegisterData = {
    nombre: string
    email: string
    password: string
    direccion: string
    codigoDestino: string
    telefono: string
}

export type LoginData = {
    email: string
    password: string
}

export type AuthResponse = {
    token: string
    user: User
}
