import type {Request} from 'express'
import type {Response} from 'express'
import {getCategories} from '../services/catalogService.js'
import {getProductById} from '../services/catalogService.js'
import {getProducts} from '../services/catalogService.js'

export async function listProducts (_req: Request, res: Response){
    try{
        const category = typeof _req.query.categoria === 'string' ? _req.query.categoria : undefined

        let categoryName: string | undefined

        if (category){
            const categories = await getCategories()
            const selectedCategory = categories.find((item) => item.slug === category)
            
            if (!selectedCategory){
                res.status(400).json({
                    message: 'La categoria o no existe o hubo un error encontrandola'
                })
                return
            }

            categoryName = selectedCategory.nombre
        }

            const products = await getProducts(categoryName)

        res.json(products)

        
    } catch (error){
        console.error('Hubieron errores intentando consultar los productos :(', error)

        res.status(500).json({
            message: 'No se pudieron consultar los productos D:'
        })
    }
}

export async function getProduct (req: Request, res: Response){
    try{
        const id = Number(req.params.id)

        if(!Number.isInteger(id) || id <= 0){
            res.status(400).json({
                message: 'El id del producto no es valido o porque no es int o porque es menor que 0'
            })

            return
        }

        const product = await getProductById(id)

        if (!product){
            res.status(404).json({
                message: 'Ese producto no se encontro'
            })
            return
        }

        res.json(product)
    } catch (error){
        console.error('Hubo un error cuando se quiso consultar con los productos :(', error)

        res.status(500).json({
            message: 'Hubo problemas para consultar el producto'
        })
    }
}