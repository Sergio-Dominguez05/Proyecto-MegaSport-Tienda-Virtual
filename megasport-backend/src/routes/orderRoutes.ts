import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js'
import type { Response } from 'express'
import { HttpError } from '../utils/httpError.js'
import { cancelOrder, orderDetail, orderList, payOrder, prepareOrder, sendOrder, trackOrder } from '../services/orderService.js'

export function endpoint(fn:(req:AuthenticatedRequest)=>Promise<unknown>) {
    return async(req:AuthenticatedRequest,res:Response) => {
        try { res.json(await fn(req)) }
        catch(error) {
            if(error instanceof HttpError){res.status(error.status).json({message:error.message});return}
            const code=(error as {code?:string})?.code
            if(code==='23505'){res.status(409).json({message:'El registro ya existe o tienes una compra en proceso'});return}
            if(code==='23503'){res.status(409).json({message:'El registro está relacionado con otros datos; no puede eliminarse'});return}
            res.status(500).json({message:'No se pudo completar la operación. Verifica la migración SQL y la conexión.'})
        }
    }
}
function id(req:AuthenticatedRequest) {
    const value=String(req.params.id)
    if(!/^\d{1,18}$/.test(value)) throw new HttpError(400,'Orden inválida')
    return value
}
const router=Router()
router.use(requireAuth)
router.get('/',endpoint(req=>orderList(req.auth!.userId)))
router.post('/',endpoint(req=>prepareOrder(req.auth!.userId,req.body??{})))
router.get('/:id',endpoint(req=>orderDetail(id(req),req.auth!.userId)))
router.post('/:id/pagar',endpoint(req=>payOrder(req.auth!.userId,id(req),req.body??{})))
router.post('/:id/cancelar',endpoint(req=>cancelOrder(req.auth!.userId,id(req))))
router.post('/:id/enviar',endpoint(req=>sendOrder(req.auth!.userId,id(req))))
router.post('/:id/rastrear',endpoint(req=>trackOrder(req.auth!.userId,id(req))))
export default router
