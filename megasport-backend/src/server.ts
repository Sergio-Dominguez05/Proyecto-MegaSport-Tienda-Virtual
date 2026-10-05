import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool } from './config/database.js'
import categoryRoutes from './routes/categoryRoutes.js'
import productRoutes from './routes/productRoutes.js'
import authRoutes from './routes/authRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import integrationRoutes from './routes/integrationRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import { expireReservations } from './services/orderService.js'

dotenv.config()

export const app = express()

const PORT = Number(process.env.PORT) || 3000

app.use(express.json())

app.use(cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173'
}))

app.get('/api/health', (_req, res) => {
    res.json({
        status: 'OK',
        message: 'Si esta funcionando la API de megasport :D'
    })
})


app.get('/api/db-test', async(_req, res) => {
    try {
        const result = await pool.query('SELECT NOW() AS fecha_servidor')

        res.json({
            status: 'OK',
            database: 'connected',
            fechaServidor: result.rows[0].fecha_servidor
        })
    } catch (error){
        console.error('No se conecto con el postgre D:', error)

        res.status(500).json({
            status: 'ERROR',
            message: 'No se pudo conectar con la base de datos D:'
        })
    }
})

app.use('/api/categorias', categoryRoutes)

app.use('/api/productos', productRoutes)

app.use('/api/auth', authRoutes)

app.use('/api/carrito', cartRoutes)

app.use('/api/integraciones', integrationRoutes)
app.use('/api/ordenes', orderRoutes)
app.use('/api/admin', adminRoutes)


if(process.env.NODE_ENV!=='test') {
app.listen(PORT, () => {
    console.log(`Se esta ejecutando la API del megasport en http://localhost:${PORT}`)
})
let expiring=false
const sweep=async()=>{
    if(expiring)return
    expiring=true
    try{await expireReservations()}catch{console.error('No se pudieron liberar reservas. Revisa la migración 03 y la conexión.')}
    finally{expiring=false}
}
void sweep()
setInterval(()=>void sweep(),60000).unref()
}
