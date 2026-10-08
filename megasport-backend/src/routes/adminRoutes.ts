import {Router} from 'express'
import {pool} from '../config/database.js'
import {requireAuth,requireRole} from '../middleware/authMiddleware.js'
import {endpoint} from './orderRoutes.js'
import {HttpError} from '../utils/httpError.js'
import {stringField,intField,cents} from '../utils/validation.js'
import {settlePayment} from '../services/orderService.js'
import {transaction} from '../utils/transaction.js'
import {registerUser} from '../services/authService.js'
type Def={table:string;key:string;fields:Record<string,string>;soft?:boolean;filter?:string}
const definitions:Record<string,Def>={
    categorias:{table:'categoria',key:'id',fields:{nombre:'text100'}},
    productos:{table:'producto',key:'id',soft:true,fields:{id_categoria:'id',nombre:'text150',descripcion:'optional1000',precio:'money',url_img:'url',activo:'bool'}},
    variantes:{table:'variante_producto',key:'id_variante',soft:true,fields:{id_producto:'id',talla:'text20',color:'text50',sku:'text50',stock:'int',stock_minimo:'int',activo:'bool'}},
    clientes:{table:'usuario',key:'id',soft:true,filter:"rol='CLIENTE'",fields:{nombre:'text150',email:'email',telefono:'text25',direccion:'text300',codigo_de_destino:'destination',activo:'bool'}},
    couriers: {
        table: 'courier',
        key: 'identificador',
        soft: true,
        fields: {
            nombre: 'text100',
            host: 'host',
            script_de_consulta: 'script',
            script_de_envio: 'script',
            script_de_status: 'script',
            formato: 'format',
            activo: 'bool'
        }
    },
    tarjetas: {
        table: 'tarjeta',
        key: 'identificador',
        soft: true,
        fields: {
            nombre: 'text50',
            host: 'host',
            script_de_autorizacion: 'script',
            formato: 'format',
            activo: 'bool'
        }
    }
}
function value(raw:unknown,type:string):unknown{
    if (type === 'format') {const s = stringField(raw,'Formato',4).toUpperCase()
        if (s !== 'JSON' && s !== 'XML') {throw new HttpError(400,'Formato debe ser JSON o XML')}return s}
    if(type==='bool'){if(typeof raw!=='boolean')throw new HttpError(400,'Valor activo inválido');return raw}
    if(type==='id'||type==='int')return intField(raw,'Número',type==='int'?0:1)
    if(type==='money')return cents(raw)/100
    if(type.startsWith('optional'))return raw?stringField(raw,'Descripción',Number(type.slice(8))):null
    if(type==='url'){
        if(!raw)return null
        const s=stringField(raw,'URL imagen',500)
        if(!/^https?:\/\//i.test(s)&&!/^\/(?!\/)/.test(s))throw new HttpError(400,'Usa una URL http/https o ruta local de imagen')
        return s
    }
    if(type==='email'){const s=stringField(raw,'Correo',254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))throw new HttpError(400,'Correo inválido');return s}
    if(type==='destination'){const s=stringField(raw,'Destino',5);if(!/^\d{5}$/.test(s))throw new HttpError(400,'Destino inválido');return s}
    if(type==='host'){
        const s=stringField(raw,'Host',45)
        try{const u=new URL(/^https?:\/\//.test(s)?s:`http://${s}`);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash||u.pathname!=='/')throw new Error()}
        catch{throw new HttpError(400,'Host inválido: IP/nombre y puerto, sin ruta ni credenciales')}
        return s
    }
    if(type==='script'){const s=stringField(raw,'Script',255);if(!s.startsWith('/')||s.startsWith('//')||s.includes('://')||s.includes('?')||s.includes('#'))throw new HttpError(400,'Script debe ser una ruta, por ejemplo /consulta');return s}
    return stringField(raw,'Texto',Number(type.replace('text','')))

    
}
function def(name:unknown):Def{const d=definitions[String(name)];if(!d)throw new HttpError(404,'Recurso no encontrado');return d}
const router=Router()
router.use(requireAuth,requireRole('ADMINISTRADOR'))
router.get('/ordenes',endpoint(async()=> (await pool.query('SELECT o.*,u.nombre AS cliente FROM orden o JOIN usuario u ON u.id=o.id_usuario ORDER BY o.id DESC LIMIT 200')).rows))
router.post('/ordenes/:id/resolver',endpoint(async req=>{
    const id=stringField(req.params.id,'orden',18)
    const order=(await pool.query('SELECT * FROM orden WHERE id=$1',[id])).rows[0]
    if(!order)throw new HttpError(404,'Orden no encontrada')
    if(req.body.confirmado!==true)throw new HttpError(400,'Primero verifica el resultado con el equipo externo')
    const note=stringField(req.body.nota,'Evidencia de la verificación',1000)
    if(req.body.tipo==='pago'){
        const status=req.body.estado
        if(status!=='APROBADO'&&status!=='DENEGADO')throw new HttpError(400,'Estado inválido')
        await settlePayment(order.id_usuario,id,status,status==='APROBADO'?stringField(req.body.referencia,'Autorización',100):null)
    }else if(req.body.tipo==='envio'){
        const notCreated=req.body.estado==='NO_CREADO'
        const reference=notCreated?null:stringField(req.body.referencia,'Número de envío',100)
        await transaction(async client=>{
            const current=(await client.query('SELECT * FROM orden WHERE id=$1 FOR UPDATE',[id])).rows[0]
            if(current.estado_de_pagado!=='APROBADO'||!['REVISION','PROCESANDO'].includes(current.envio_proceso))throw new HttpError(409,'No hay envío por conciliar')
            await client.query("UPDATE orden SET envio_proceso=$3,num_envio=$2 WHERE id=$1",[id,reference,notCreated?'PENDIENTE':'CREADO'])
        })
    }else throw new HttpError(400,'Tipo inválido')
    await pool.query('UPDATE orden SET nota_revision=$2 WHERE id=$1',[id,`Verificado por administrador ${req.auth!.userId}: ${note}`])
    return {message:'Resultado conciliado. No se realizó otra llamada de cobro/envío.'}
}))
router.get('/:recurso',endpoint(async req=>{
    const d=def(req.params.recurso)
    const fields=[d.key,...Object.keys(d.fields)]
    return (await pool.query(`SELECT ${fields.join(',')} FROM ${d.table} ${d.filter?'WHERE '+d.filter:''} ORDER BY ${d.key} LIMIT 500`)).rows
}))
router.post('/:recurso',endpoint(async req=>{
    const d=def(req.params.recurso),fields=Object.keys(d.fields)
    const values=fields.map(f=>value(req.body[f],d.fields[f]!))
    if(d.table==='usuario'){
        if(String(req.body.password??'').length<8)throw new HttpError(400,'Contraseña mínima: 8 caracteres')
        const created=await registerUser({nombre:String(req.body.nombre),email:String(req.body.email),
            password:stringField(req.body.password,'Contraseña',72),telefono:String(req.body.telefono),
            direccion:String(req.body.direccion),codigoDestino:String(req.body.codigo_de_destino)})
        if(req.body.activo===false)await pool.query('UPDATE usuario SET activo=FALSE WHERE id=$1',[created.user.id])
        return {id:created.user.id}
    }
    if(d.key==='identificador'){
        fields.unshift(d.key);values.unshift(stringField(req.body.identificador,'Identificador',15))
    }
    return (await pool.query(`INSERT INTO ${d.table}(${fields.join(',')}) VALUES(${values.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING ${d.key}`,values)).rows[0]
}))
router.put('/:recurso/:id',endpoint(async req=>{
    const d=def(req.params.recurso),fields=Object.keys(d.fields)
    const values=fields.map(f=>value(req.body[f],d.fields[f]!))
    values.push(String(req.params.id))
    const result=await pool.query(`UPDATE ${d.table} SET ${fields.map((f,i)=>f+'=$'+(i+1)).join(',')} WHERE ${d.key}=$${values.length} ${d.filter?'AND '+d.filter:''} RETURNING ${d.key}`,values)
    if(!result.rows.length)throw new HttpError(404,'Registro no encontrado')
    return result.rows[0]
}))
router.delete('/:recurso/:id',endpoint(async req=>{
    const d=def(req.params.recurso)
    const result=await pool.query(`${d.soft?'UPDATE '+d.table+' SET activo=FALSE':'DELETE FROM '+d.table} WHERE ${d.key}=$1 ${d.filter?'AND '+d.filter:''} RETURNING ${d.key}`,[String(req.params.id)])
    if(!result.rows.length)throw new HttpError(404,'Registro no encontrado')
    return {message:d.soft?'Registro desactivado; se conserva el historial':'Registro eliminado'}
}))
export default router
