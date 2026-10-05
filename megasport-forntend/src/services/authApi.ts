import type { AuthResponse, LoginData, RegisterData, User } from '../types/auth'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
    throw new Error('VITE_API_URL no está definida en el .env del frontend')
}

async function readJson<T>(response: Response): Promise<T> {
    const data = await response.json() as T & { message?: string }

    if (!response.ok) {
        throw new Error(data.message ?? 'No fue posible completar la solicitud')
    }

    return data
}

export async function registerRequest(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })

    return readJson<AuthResponse>(response)
}

export async function loginRequest(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })

    return readJson<AuthResponse>(response)
}

export async function profileRequest(token: string): Promise<User> {
    const response = await fetch(`${API_URL}/auth/perfil`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    const result = await readJson<{ user: User }>(response)
    return result.user
}
