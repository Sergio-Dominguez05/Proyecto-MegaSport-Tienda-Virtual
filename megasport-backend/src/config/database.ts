import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const {Pool} = pg

if (!process.env.DATABASE_URL){
    throw new Error(' No esta bien definida la URL de la base de datos en .env')
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})