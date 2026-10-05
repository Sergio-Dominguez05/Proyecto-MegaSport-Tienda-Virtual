import { Router } from 'express'
import { adminAccess, login, profile, register } from '../controllers/authController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/registro', register)
router.post('/login', login)
router.get('/perfil', requireAuth, profile)
router.get('/verificar-admin', requireAuth, requireRole('ADMINISTRADOR'), adminAccess)

export default router
