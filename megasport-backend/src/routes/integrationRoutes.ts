import { Router } from 'express'
import { quoteCouriers } from '../controllers/integrationController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()
router.use(requireAuth)

router.get('/couriers/cotizaciones', quoteCouriers)
// Pago/envío pasan exclusivamente por /ordenes: precio y propiedad verificados.

export default router
