import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool } from './config/database.js'

dotenv.config()

const app = express()

const PORT = Number(process.env.PORT) || 3000

app.use(express.json())

app.use(cors())

app.get('/api/health', (_req, res) => {
    res.json({
        status: 'OK',
        message: 'Si esta funcionando la API de megasport :D'
    })
})

/**Prueba de conexion con postgre */

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

app.get('/api/test/productos', async (_req, res) => {

    try {

      const result = await pool.query(`SELECT id, nombre, descripcion, precio, url_img, activo FROM producto ORDER BY id`)

      res.json(result.rows)

    } catch (error) {

      console.error(error)

      res.status(500).json({
        message:
          'Error consultando productos',
      })

    }

  }
)

app.listen(PORT, () => {
    console.log(`Se esta ejecutando la API del megasport en http://localhost:${PORT}`)
})