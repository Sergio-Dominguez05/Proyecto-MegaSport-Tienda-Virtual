export type FlatExternalPayload = Record<string, string>

// Flattens JSON/XML-derived objects to lowercase leaf aliases.
// Example: { respuesta: { datos: { Status: 'APROBADO' } } }
// exposes both "respuesta.datos.status" and "status".
export function flattenExternalPayload(
    value: unknown,
    prefix = '',
    output: FlatExternalPayload = {},
): FlatExternalPayload {
    if (value === null || value === undefined) return output

    if (typeof value !== 'object') {
        if (prefix) output[prefix] = String(value).trim()
        return output
    }

    if (Array.isArray(value)) {
        value.forEach((item, index) => {
            const path = prefix ? `${prefix}.${index}` : String(index)
            flattenExternalPayload(item, path, output)
        })
        return output
    }

    for (const [rawKey, child] of Object.entries(value as Record<string, unknown>)) {
        const key = rawKey.toLowerCase().replace(/^@_/, '')
        const path = prefix ? `${prefix}.${key}` : key

        if (child !== null && typeof child === 'object') {
            flattenExternalPayload(child, path, output)
            continue
        }

        const text = child === null || child === undefined ? '' : String(child).trim()
        output[path] = text
        // Leaf aliases make wrappers such as { autorizacion: { status: ... } } transparent.
        if (!(key in output)) output[key] = text
    }

    return output
}

export function externalField(
    value: unknown,
    ...aliases: string[]
): string | undefined {
    const flat = flattenExternalPayload(value)
    for (const alias of aliases) {
        const found = flat[alias.toLowerCase()]
        if (found !== undefined && found !== '') return found
    }
    return undefined
}

export function externalHasField(value: unknown, alias: string): boolean {
    const flat = flattenExternalPayload(value)
    return alias.toLowerCase() in flat
}

export function normalizeExternalText(value: string): string {
    return value
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
}
