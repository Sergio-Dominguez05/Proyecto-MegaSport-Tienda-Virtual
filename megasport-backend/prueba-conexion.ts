// Guardar en megasport-backend, junto a package.json y .env.
// Ejecutar desde esa carpeta: npx tsx prueba-conexion.ts
import { randomUUID } from 'node:crypto'
import { pool } from './src/config/database.js'

async function main() {
    const nombre = `PRUEBA_CONEXION_${randomUUID()}`
    const client = await pool.connect()
    try {
        const info = await client.query(`SELECT current_database() AS base,
            current_user AS usuario, inet_server_addr()::text AS ip_servidor,
            inet_server_port() AS puerto`)
        console.log('Carpeta desde donde ejecutaste la prueba:', process.cwd())
        console.log('Conexion efectiva (sin contrasena):')
        console.table(info.rows)
        const result = await client.query(
            'INSERT INTO public.categoria (nombre) VALUES ($1) RETURNING id, nombre',
            [nombre],
        )
        console.log('Categoria de prueba guardada:')
        console.table(result.rows)
        console.log('\nBusca esta marca en pgAdmin local y en Supabase:')
        console.log(`SELECT id, nombre FROM public.categoria WHERE nombre = '${nombre}';`)
        console.log('\nPara eliminar SOLO esta categoria al terminar:')
        console.log(`DELETE FROM public.categoria WHERE nombre = '${nombre}';`)
        console.log('\nEsta prueba verifica este proceso. Un backend anterior que siga abierto puede usar otra conexion.')
    } finally {
        client.release()
    }
}

main().catch((error: unknown) => {
    const code = (error as { code?: string })?.code
    console.error('No se pudo completar la prueba. Codigo:', code ?? 'SIN_CODIGO')
    console.error('Revisa .env, que PostgreSQL este encendido y que exista public.categoria.')
    process.exitCode = 1
}).finally(async () => { await pool.end() })
