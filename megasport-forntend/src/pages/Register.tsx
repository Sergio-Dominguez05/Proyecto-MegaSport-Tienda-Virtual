import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { RegisterData } from '../types/auth'

const initialForm: RegisterData = {
    nombre: '',
    email: '',
    password: '',
    direccion: '',
    codigoDestino: '',
    telefono: '',
}

function Register() {
    const { user, register } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState(initialForm)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    if (user) {
        return <Navigate to="/" replace />
    }

    const updateField = (field: keyof RegisterData, value: string) => {
        setForm((current) => ({ ...current, [field]: value }))
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setSubmitting(true)
        setError('')

        try {
            await register(form)
            navigate('/', { replace: true })
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'No fue posible crear la cuenta')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="mx-auto w-full max-w-2xl px-6 py-16">
            <h1 className="text-4xl font-bold text-slate-900">Crear cuenta</h1>
            <p className="mt-3 text-gray-600">Tus datos se usarán para asociar el carrito y las órdenes.</p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5 rounded-2xl border border-gray-200 bg-white p-7 md:grid-cols-2">
                <Field label="Nombre completo" value={form.nombre} onChange={(value) => updateField('nombre', value)} autoComplete="name" />
                <Field label="Correo" type="email" value={form.email} onChange={(value) => updateField('email', value)} autoComplete="email" />
                <Field label="Teléfono" value={form.telefono} onChange={(value) => updateField('telefono', value)} autoComplete="tel" />
                <Field label="Código de destino" value={form.codigoDestino} onChange={(value) => updateField('codigoDestino', value.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" />
                <div className="md:col-span-2">
                    <Field label="Dirección" value={form.direccion} onChange={(value) => updateField('direccion', value)} autoComplete="street-address" />
                </div>
                <div className="md:col-span-2">
                    <Field label="Contraseña" type="password" value={form.password} onChange={(value) => updateField('password', value)} autoComplete="new-password" minLength={8} />
                </div>

                {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 md:col-span-2">{error}</p>}

                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white disabled:bg-gray-400 md:col-span-2"
                >
                    {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
                ¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-slate-950">Inicia sesión</Link>
            </p>
        </main>
    )
}

type FieldProps = {
    label: string
    value: string
    onChange: (value: string) => void
    type?: string
    autoComplete?: string
    inputMode?: 'text' | 'numeric'
    minLength?: number
}

function Field({ label, value, onChange, type = 'text', ...inputProps }: FieldProps) {
    return (
        <label className="block text-sm font-semibold text-slate-800">
            {label}
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required
                {...inputProps}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:border-slate-900"
            />
        </label>
    )
}

export default Register
