import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function Login() {
    const { user, login } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    if (user) {
        return <Navigate to="/" replace />
    }

    const destination = typeof location.state === 'object'
        && location.state !== null
        && 'from' in location.state
        && typeof location.state.from === 'string'
        ? location.state.from
        : '/'

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setSubmitting(true)
        setError('')

        try {
            await login({ email, password })
            navigate(destination, { replace: true })
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'No fue posible iniciar sesión')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="mx-auto w-full max-w-md px-6 py-16">
            <h1 className="text-4xl font-bold text-slate-900">Iniciar sesión</h1>
            <p className="mt-3 text-gray-600">Accede para continuar con tu compra.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-gray-200 bg-white p-7">
                <label className="block text-sm font-semibold text-slate-800">
                    Correo
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        autoComplete="email"
                        className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:border-slate-900"
                    />
                </label>

                <label className="block text-sm font-semibold text-slate-800">
                    Contraseña
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        autoComplete="current-password"
                        className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:border-slate-900"
                    />
                </label>

                {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white disabled:bg-gray-400"
                >
                    {submitting ? 'Ingresando...' : 'Ingresar'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
                ¿No tienes cuenta? <Link to="/registro" className="font-semibold text-slate-950">Regístrate</Link>
            </p>
        </main>
    )
}

export default Login
