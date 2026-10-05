import bcrypt from 'bcryptjs'
import { pool } from '../config/database.js'

const [, , emailArgument, passwordArgument] = process.argv
const email = emailArgument?.trim().toLowerCase()
const password = passwordArgument ?? ''

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Uso: npm run set-password -- correo@ejemplo.com "ContraseñaSegura"')
    process.exitCode = 1
} else if (password.length < 8 || password.length > 72) {
    console.error('La contraseña debe tener entre 8 y 72 caracteres')
    process.exitCode = 1
} else {
    try {
        const passwordHash = await bcrypt.hash(password, 12)
        const result = await pool.query<{ id: number; email: string; rol: string }>(
            `UPDATE usuario
             SET hash_contrasena = $1
             WHERE LOWER(email) = LOWER($2)
             RETURNING id, email, rol`,
            [passwordHash, email],
        )

        const user = result.rows[0]
        if (!user) {
            console.error(`No existe un usuario con el correo ${email}`)
            process.exitCode = 1
        } else {
            console.log(`Contraseña actualizada para ${user.email} (${user.rol})`)
        }
    } catch (error) {
        console.error('No fue posible actualizar la contraseña:', error)
        process.exitCode = 1
    } finally {
        await pool.end()
    }
}
