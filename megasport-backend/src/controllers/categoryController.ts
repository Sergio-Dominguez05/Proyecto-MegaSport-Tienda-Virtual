import type {Request} from 'express'
import type {Response} from 'express'
import {getCategories} from '../services/catalogService.js'

export async function listCategories(_req: Request, res: Response) {
    try {
        const categories = await getCategories()
        res.json(categories)
    } catch (error){
        console.error(' Hubo un error cuando se quisieron consulatar las categorias :(', error)
        res.status(500).json({
            message: 'No se pudieron consultar bien las categorias :('
        })
    }
    
}