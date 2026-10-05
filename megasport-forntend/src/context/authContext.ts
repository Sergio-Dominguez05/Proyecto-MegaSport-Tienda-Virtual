import { createContext } from 'react'
import type { LoginData, RegisterData, User } from '../types/auth'

export type AuthContextValue = {
    user: User | null
    token: string | null
    loading: boolean
    login: (data: LoginData) => Promise<void>
    register: (data: RegisterData) => Promise<void>
    logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
