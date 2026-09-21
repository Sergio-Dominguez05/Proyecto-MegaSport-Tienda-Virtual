import {Router} from 'express'
import {getProduct} from '../controllers/productController.js'
import {listProducts} from '../controllers/productController.js'

const router = Router()

router.get('/', listProducts)

router.get('/:id', getProduct)

export default router