import { Router } from 'express'
import { addItem, clearCart, getCart, removeItem, updateItem } from '../controllers/cartController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { endpoint } from './orderRoutes.js'
import { mergeGuestCart } from '../services/cartService.js'

const router = Router()

router.use(requireAuth)
router.get('/', getCart)
router.post('/fusionar', endpoint(req=>mergeGuestCart(req.auth!.userId,req.body?.items)))
router.post('/articulos', addItem)
router.patch('/articulos/:idVariante', updateItem)
router.delete('/articulos/:idVariante', removeItem)
router.delete('/', clearCart)

export default router
