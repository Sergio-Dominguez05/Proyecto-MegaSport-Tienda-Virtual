import { HttpError } from './httpError.js'
export function stringField(value: unknown, name: string, max=300): string {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
        throw new HttpError(400, `${name}: texto obligatorio (máximo ${max} caracteres)`)
    return value.trim()
}
export function intField(value: unknown, name: string, min=1): number {
    if (typeof value !== 'number' && typeof value !== 'string') throw new HttpError(400, `${name} inválido`)
    const n=Number(value)
    if (!Number.isSafeInteger(n) || n<min || n>2147483647) throw new HttpError(400, `${name} inválido`)
    return n
}
export function cents(value: unknown): number {
    if (value === null || value === undefined || value === '') throw new HttpError(400, 'Monto inválido')
    const n=Number(value)
    if (!Number.isFinite(n) || n<0 || n>99999999.99 || Math.abs(n*100-Math.round(n*100))>0.00001)
        throw new HttpError(400, 'Monto inválido; usa como máximo dos decimales')
    return Math.round(n*100)
}
