import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { loginRequest, profileRequest, registerRequest } from '../services/authApi'
import type { LoginData, RegisterData, User } from '../types/auth'
import { AuthContext } from './authContext'

const TOKEN_KEY = 'megasport-auth-token'

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(Boolean(token))

    useEffect(() => {
        if (!token) {
            return
        }

        let cancelled = false

        void profileRequest(token)
            .then((profile) => {
                if (!cancelled) {
                    setUser(profile)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    localStorage.removeItem(TOKEN_KEY)
                    setToken(null)
                    setUser(null)
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [token])

    const saveSession = (nextToken: string, nextUser: User) => {
        localStorage.setItem(TOKEN_KEY, nextToken)
        setToken(nextToken)
        setUser(nextUser)
        setLoading(false)
    }

    const login = async (data: LoginData) => {
        const result = await loginRequest(data)
        saveSession(result.token, result.user)
    }

    const register = async (data: RegisterData) => {
        const result = await registerRequest(data)
        saveSession(result.token, result.user)
    }

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
        setLoading(false)
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
