import type { PoolClient } from 'pg'
import { pool } from '../config/database.js'
import { transaction } from '../utils/transaction.js'
import { HttpError } from '../utils/httpError.js'
import { cents, stringField } from '../utils/validation.js'
import { authorizeCard, CARD_PREFIX, quoteAllCouriers, requestShipment, requestShipmentStatus, serviceMode } from './integrationService.js'

export type OrderRow = {
    id:string; id_usuario:number; id_carrito:number|null; id_courier:string; id_tarjeta:string|null
    estado_de_pagado:string; envio_proceso:string; modo:string; stock_reservado:boolean
    total:string; subtotal_antes_de_envio:string; costo_envio:string
    destinatario:string; codigo_del_destino:string; direccion_de_envio:string
    num_envio:string|null; num_autorizacion:string|null; estado_envio:number; vence_en:Date|null
}

async function owned(client:PoolClient,id:string,userId:number):Promise<OrderRow> {
    const result=await client.query<OrderRow>('SELECT * FROM orden WHERE id=$1 AND id_usuario=$2 FOR UPDATE',[id,userId])
    if(!result.rows[0]) throw new HttpError(404,'Orden no encontrada')
    return result.rows[0]
}
async function lockUser(client:PoolClient,userId:number) {
    await client.query('SELECT id FROM usuario WHERE id=$1 FOR UPDATE',[userId])
}
async function releaseStock(client:PoolClient,order:OrderRow) {
    if(!order.stock_reservado) return
    const details=await client.query('SELECT id_variante,cantidad_de_articulos FROM detalle_orden WHERE id_orden=$1 ORDER BY id_variante',[order.id])
    for(const d of details.rows) await client.query('UPDATE variante_producto SET stock=stock+$1 WHERE id_variante=$2',[d.cantidad_de_articulos,d.id_variante])
    await client.query('UPDATE orden SET stock_reservado=FALSE WHERE id=$1',[order.id])
}
export async function orderDetail(id:string,userId:number) {
    const result=await pool.query('SELECT * FROM orden WHERE id=$1 AND id_usuario=$2',[id,userId])
    if(!result.rows[0]) throw new HttpError(404,'Orden no encontrada')
    const details=await pool.query('SELECT * FROM detalle_orden WHERE id_orden=$1 ORDER BY id',[id])
    return {...result.rows[0], detalles:details.rows}
}
export async function orderList(userId:number) {
    return (await pool.query('SELECT * FROM orden WHERE id_usuario=$1 ORDER BY id DESC LIMIT 100',[userId])).rows
}
export async function expireReservations() {
    const expired=await pool.query("SELECT id,id_usuario FROM orden WHERE estado_de_pagado='PENDIENTE' AND vence_en<NOW() LIMIT 100")
    for(const item of expired.rows){
        await transaction(async client=>{
            await lockUser(client,item.id_usuario)
            const order=await owned(client,String(item.id),item.id_usuario)
            if(order.estado_de_pagado!=='PENDIENTE'||!order.vence_en||new Date(order.vence_en)>=new Date())return
            await releaseStock(client,order)
            await client.query("UPDATE orden SET estado_de_pagado='CANCELADO' WHERE id=$1",[order.id])
        })
    }
}
export async function prepareOrder(userId:number,input:Record<string,unknown>) {
    const key=stringField(input.clave,'clave',36)
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) throw new HttpError(400,'Clave de compra inválida')
    const address=stringField(input.direccion,'dirección')
    const destination=stringField(input.destino,'destino',5)
    if(!/^\d{5}$/.test(destination)) throw new HttpError(400,'El destino debe tener 5 dígitos')
    const courierId=stringField(input.courierId,'courier',15)
    const existing=await pool.query('SELECT id FROM orden WHERE id_usuario=$1 AND clave_solicitud=$2',[userId,key])
    if(existing.rows[0]) return orderDetail(String(existing.rows[0].id),userId)
    const quotes = await quoteAllCouriers(destination)
    const quote=quotes.find(q=>q.courierId===courierId && q.cobertura && q.costoEnvio!==null)
    if(!quote) throw new HttpError(409,'El courier no confirmó cobertura y precio. Vuelve a cotizar.')
    const shipping=cents(quote.costoEnvio)
    const id=await transaction(async client=>{
        await lockUser(client,userId)
        const duplicate=await client.query('SELECT id FROM orden WHERE id_usuario=$1 AND clave_solicitud=$2',[userId,key])
        if(duplicate.rows[0]) return String(duplicate.rows[0].id)
        const active=await client.query<OrderRow>("SELECT * FROM orden WHERE id_usuario=$1 AND estado_de_pagado IN ('PENDIENTE','PROCESANDO','REVISION') FOR UPDATE",[userId])
        for(const old of active.rows) {
            if(old.estado_de_pagado==='PENDIENTE' && old.vence_en && new Date(old.vence_en)<new Date()){
                await releaseStock(client,old)
                await client.query("UPDATE orden SET estado_de_pagado='CANCELADO' WHERE id=$1",[old.id])
            }else throw new HttpError(409,`Ya tienes una compra pendiente: orden ${old.id}. Revísala en Mis pedidos.`)
        }
        const cart=await client.query('SELECT id FROM carrito WHERE id_usuario=$1 ORDER BY creado_en DESC,id DESC LIMIT 1 FOR UPDATE',[userId])
        if(!cart.rows[0]) throw new HttpError(409,'El carrito está vacío')
        const cartId=cart.rows[0].id
        const items=await client.query(`SELECT a.cantidad,a.id_variante,v.stock,v.activo,p.activo AS producto_activo,
            p.precio,p.nombre,v.sku,v.talla,v.color,p.url_img
            FROM articulo_en_carrito a JOIN variante_producto v ON v.id_variante=a.id_variante
            JOIN producto p ON p.id=v.id_producto WHERE a.id_carrito=$1
            ORDER BY v.id_variante FOR UPDATE OF a,v FOR SHARE OF p`,[cartId])
        if(!items.rows.length) throw new HttpError(409,'El carrito está vacío')
        let subtotal=0
        for(const item of items.rows){
            if(!item.activo || !item.producto_activo || item.cantidad>item.stock)
                throw new HttpError(409,`Stock insuficiente o producto inactivo: ${item.nombre}`)
            subtotal+=cents(item.precio)*item.cantidad
        }
        cents((subtotal+shipping)/100)
        const user=await client.query('SELECT nombre FROM usuario WHERE id=$1',[userId])
        const created=await client.query(`INSERT INTO orden
            (id_usuario,id_courier,subtotal_antes_de_envio,costo_envio,total,codigo_del_destino,
            direccion_de_envio,estado_de_pagado,clave_solicitud,id_carrito,destinatario,modo,stock_reservado,vence_en)
            VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDIENTE',$8,$9,$10,$11,TRUE,NOW()+INTERVAL '20 minutes') RETURNING id`,
            [userId,courierId,subtotal/100,shipping/100,(subtotal+shipping)/100,destination,address,key,cartId,user.rows[0].nombre,serviceMode()])
        const orderId=String(created.rows[0].id)
        for(const item of items.rows){
            await client.query(`INSERT INTO detalle_orden (id_orden,id_variante,precio_por_unidad,cantidad_de_articulos,nombre_producto,sku,talla,color,url_img)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[orderId,item.id_variante,item.precio,item.cantidad,item.nombre,item.sku,item.talla,item.color,item.url_img])
            await client.query('UPDATE variante_producto SET stock=stock-$1 WHERE id_variante=$2',[item.cantidad,item.id_variante])
        }
        return orderId
    })
    return orderDetail(id,userId)
}
export async function cancelOrder(userId:number,id:string) {
    await transaction(async client=>{
        await lockUser(client,userId)
        const order=await owned(client,id,userId)
        if(order.estado_de_pagado==='CANCELADO') return
        if(order.estado_de_pagado!=='PENDIENTE') throw new HttpError(409,'Solo se puede cancelar una orden sin intento de pago')
        await releaseStock(client,order)
        await client.query("UPDATE orden SET estado_de_pagado='CANCELADO' WHERE id=$1",[id])
    })
    return orderDetail(id,userId)
}

export async function payOrder(userId:number,id:string,input:Record<string,unknown>) {
    // Las credenciales existen únicamente en memoria durante la solicitud.
    const tarjeta=stringField(input.numeroTarjeta,'tarjeta',19)
    const nombre=stringField(input.titular,'titular',150)
    const fechaVencimiento=stringField(input.vencimiento,'vencimiento',6)
    const numeroSeguridad=stringField(input.seguridad,'seguridad',4)
    const issuerId=CARD_PREFIX[tarjeta[0]!]
    if(!/^\d{13,19}$/.test(tarjeta) || !issuerId || !/^\d{3,4}$/.test(numeroSeguridad)) throw new HttpError(400,'Datos de tarjeta inválidos')
    const now=new Date()
    if(!/^\d{6}$/.test(fechaVencimiento) || Number(fechaVencimiento.slice(4))<1 || Number(fechaVencimiento.slice(4))>12 ||
        Number(fechaVencimiento)<now.getFullYear()*100+now.getMonth()+1) throw new HttpError(400,'Vencimiento inválido. Usa AAAAMM.')
    const issuer=await pool.query('SELECT identificador FROM tarjeta WHERE identificador=$1 AND activo=TRUE',[issuerId])
    if(!issuer.rows.length) throw new HttpError(409,'Emisor no disponible')
    const order=await transaction(async client=>{
        await lockUser(client,userId)
        const order=await owned(client,id,userId)
        if(order.estado_de_pagado!=='PENDIENTE') return null
        if(order.modo!==serviceMode()) throw new HttpError(409,'El modo del servidor cambió. Cancela esta orden y crea otra.')
        if(order.vence_en && new Date(order.vence_en)<new Date()) {
            await releaseStock(client,order)
            await client.query("UPDATE orden SET estado_de_pagado='CANCELADO' WHERE id=$1",[id])
            return null
        }
        await client.query("UPDATE orden SET estado_de_pagado='PROCESANDO',id_tarjeta=$2 WHERE id=$1",[id,issuerId])
        return order
    })
    if(!order) return orderDetail(id,userId)
    try {
        const result = await authorizeCard({
            tarjeta,
            nombre,
            fechaVencimiento,
            numeroSeguridad,
            monto: Number(order.total)
        })
        await settlePayment(userId,id,result.status,result.authorizationNumber)
    } catch {
        // Nunca reintentar a ciegas: la petición pudo haber sido cobrada aunque se perdiera la respuesta.
        await pool.query("UPDATE orden SET estado_de_pagado='REVISION',nota_revision='Verificar resultado con el emisor antes de continuar; no repetir cobro.' WHERE id=$1 AND estado_de_pagado='PROCESANDO'",[id])
    }
    return orderDetail(id,userId)
}
export async function settlePayment(userId:number,id:string,status:'APROBADO'|'DENEGADO',authorization:string|null) {
    await transaction(async client=>{
        await lockUser(client,userId)
        const order=await owned(client,id,userId)
        if(!['PROCESANDO','REVISION'].includes(order.estado_de_pagado)) throw new HttpError(409,'El pago ya está resuelto')
        if(status==='APROBADO'){
            if(!authorization) throw new HttpError(400,'Falta autorización')
            // Stock ya descontado como reserva; no descontar otra vez.
            await client.query("UPDATE orden SET estado_de_pagado='APROBADO',num_autorizacion=$2,stock_reservado=FALSE,nota_revision=NULL WHERE id=$1",[id,authorization])
            await client.query('DELETE FROM articulo_en_carrito WHERE id_carrito=$1',[order.id_carrito])
        } else {
            await releaseStock(client,order)
            await client.query("UPDATE orden SET estado_de_pagado='DENEGADO',nota_revision=NULL WHERE id=$1",[id])
        }
    })
}
export async function sendOrder(userId:number,id:string) {
    const order=await transaction(async client=>{
        const order=await owned(client,id,userId)
        if(order.estado_de_pagado!=='APROBADO') throw new HttpError(409,'La orden no está pagada')
        if(order.envio_proceso!=='PENDIENTE') return null
        if(order.modo!==serviceMode()) throw new HttpError(409,'El modo del servidor no coincide con la orden')
        await client.query("UPDATE orden SET envio_proceso='PROCESANDO' WHERE id=$1",[id])
        return order
    })
    if(!order) return orderDetail(id,userId)
    try {
        const shipment = await requestShipment(
        order.id_courier,
        {
            orden: id,
            destinatario: order.destinatario,
            destino: order.codigo_del_destino,
            direccion: order.direccion_de_envio
        }
    )
        if(shipment.numeroEnvio.length>100) throw new Error('Referencia inválida')
        await pool.query("UPDATE orden SET envio_proceso='CREADO',num_envio=$2,estado_envio=$3,nota_revision=NULL WHERE id=$1",
            [id,shipment.numeroEnvio,shipment.estadoEnvio])
    } catch {
        await pool.query("UPDATE orden SET envio_proceso='REVISION',nota_revision='Consultar con courier si ya recibió la orden. No reenviar sin verificar.' WHERE id=$1",[id])
    }
    return orderDetail(id,userId)
}
export async function trackOrder(userId:number,id:string) {
    const order=await orderDetail(id,userId)
    if(order.envio_proceso!=='CREADO') throw new HttpError(409,'El envío aún no está confirmado')
    if(order.modo!==serviceMode()) throw new HttpError(409,'El modo no coincide con esta orden')
    // Exactamente la misma referencia de orden enviada al crear el envío.
    const result = await requestShipmentStatus(
        order.id_courier,
        id
    )
    await pool.query('UPDATE orden SET estado_envio=GREATEST(estado_envio,$2) WHERE id=$1',[id,result.estadoEnvio])
    return orderDetail(id,userId)
}
