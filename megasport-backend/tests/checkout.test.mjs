// PostgreSQL embebido y proveedores HTTP locales. Nunca usa Supabase ni tarjetas reales.
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createServer} from 'node:http'
import {PGlite} from '@electric-sql/pglite'
import jwt from 'jsonwebtoken'

test('Compra persistente, autorización, inventario, idempotencia y permisos',async t=>{
    process.env.NODE_ENV='test'
    process.env.DATABASE_URL='postgresql://test:test@127.0.0.1:1/test'
    process.env.JWT_SECRET='solo-pruebas-aisladas-secreto-no-utilizar-en-produccion'
    process.env.EXTERNAL_SERVICES_MODE='mock'
    const db=new PGlite()
    for(const file of ['01_schema.sql','02_seed.sql','03_ordenes.sql'])
        await db.exec(await readFile(new URL('../../database/'+file,import.meta.url),'utf8'))
    const {pool}=await import('../dist/config/database.js')
    const query=async(sql,params)=>{const r=await db.query(sql,params);return {...r,rowCount:r.affectedRows??r.rows.length}}
    // Una sola conexión PostgreSQL embebida; las pruebas se ejecutan secuencialmente.
    pool.query=query
    pool.connect=async()=>({query,release(){}})
    const {app}=await import('../dist/server.js')
    const {expireReservations}=await import('../dist/services/orderService.js')
    const server=app.listen(0,'127.0.0.1')
    await new Promise(r=>server.once('listening',r))
    const base='http://127.0.0.1:'+server.address().port+'/api'
    let payCount=0,shipCount=0,lastSent='',lastTracked='',ambiguousPay=false,ambiguousShip=false
    const provider=createServer((req,res)=>{
        const url=new URL(req.url,'http://localhost')
        res.setHeader('Content-Type','application/json')
        if(url.pathname==='/consulta') return res.end(JSON.stringify({courier:'Equipo local',destino:url.searchParams.get('destino'),cobertura:true,costo:30}))
        if(url.pathname==='/autorizacion'){
            payCount++
            assert.equal(url.searchParams.get('monto'),'529.98')
            if(ambiguousPay)return res.end(JSON.stringify({status:'DESCONOCIDO'}))
            return res.end(JSON.stringify({emisor:'VISA',status:'APROBADO',numero:'000123'}))
        }
        if(url.pathname==='/envio'){
            shipCount++;lastSent=url.searchParams.get('orden')
            if(ambiguousShip)return res.end(JSON.stringify({error:'sin confirmación'}))
            return res.end(JSON.stringify({numero:'GUIA-DISTINTA-'+lastSent,status:1}))
        }
        lastTracked=url.searchParams.get('orden')
        return res.end(JSON.stringify({status:4}))
    })
    provider.listen(0,'127.0.0.1')
    await new Promise(r=>provider.once('listening',r))
    t.after(async()=>{await Promise.all([new Promise(r=>server.close(r)),new Promise(r=>provider.close(r))]);await db.close();await pool.end()})
    async function http(path,token,method='GET',body){
        const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})})
        return {status:response.status,body:await response.json()}
    }
    async function ok(path,token,method='GET',body){const r=await http(path,token,method,body);assert.equal(r.status,200,JSON.stringify(r.body));return r.body}
    const data={nombre:'Cliente de prueba',email:'uno@test.local',password:'Prueba12345',direccion:'Direccion ficticia 123',codigoDestino:'01001',telefono:'12345678'}
    const a=await http('/auth/registro',null,'POST',data);assert.equal(a.status,201)
    const token=a.body.token,id=a.body.user.id
    const b=await http('/auth/registro',null,'POST',{...data,email:'dos@test.local'})
    const other=b.body.token
    const adminId=(await query("SELECT id FROM usuario WHERE rol='ADMINISTRADOR'")).rows[0].id
    const admin=jwt.sign({role:'ADMINISTRADOR'},process.env.JWT_SECRET,{issuer:'megasport-api',subject:String(adminId)})
    const card={numeroTarjeta:'4001000000000002',titular:'Prueba',vencimiento:'209912',seguridad:'123'}
    const variant=(await query("SELECT id_variante,stock FROM variante_producto WHERE sku='CAM-RUN-S-NEG'")).rows[0]
    const stock=async()=>(await query('SELECT stock FROM variante_producto WHERE id_variante=$1',[variant.id_variante])).rows[0].stock
    async function prepare(){
        const key=crypto.randomUUID()
        const input={clave:key,courierId:'COUR-001',destino:'01001',direccion:'Direccion prueba',total:0.01}
        return {order:await ok('/ordenes',token,'POST',input),input}
    }
    await t.test('Autenticación y roles del servidor',async()=>{
        assert.equal((await http('/ordenes')).status,401)
        assert.equal((await http('/admin/productos',token)).status,403)
        assert.equal((await http('/admin/productos',admin)).status,200)
    })
    await t.test('Fusión idempotente y stock insuficiente',async()=>{
        await ok('/carrito/fusionar',token,'POST',{items:[{idVariante:variant.id_variante,cantidad:2}]})
        await ok('/carrito/fusionar',token,'POST',{items:[{idVariante:variant.id_variante,cantidad:2}]})
        assert.equal((await ok('/carrito',token)).items[0].cantidad,2)
        assert.equal((await http('/carrito/articulos',token,'POST',{idVariante:variant.id_variante,cantidad:999})).status,409)
    })
    let first
    await t.test('Orden histórica, cálculo servidor y reserva una sola vez',async()=>{
        const {order,input}=await prepare();first=order
        assert.equal(Number(order.total),524.98)
        assert.equal(order.detalles[0].nombre_producto,'Camiseta Running Pro')
        assert.equal(await stock(),variant.stock-2)
        assert.equal((await ok('/ordenes',token,'POST',input)).id,order.id)
        assert.equal(await stock(),variant.stock-2)
        assert.equal((await http('/ordenes/'+order.id,other)).status,404)
        assert.equal((await http('/carrito',token,'DELETE')).status,409)
    })
    await t.test('Pago aprobado y repetido, vaciado atómico, envío y rastreo',async()=>{
        let order=await ok('/ordenes/'+first.id+'/pagar',token,'POST',card)
        assert.equal(order.estado_de_pagado,'APROBADO')
        const auth=order.num_autorizacion
        order=await ok('/ordenes/'+first.id+'/pagar',token,'POST',card)
        assert.equal(order.num_autorizacion,auth)
        assert.equal(await stock(),variant.stock-2)
        assert.equal((await ok('/carrito',token)).items.length,0)
        order=await ok('/ordenes/'+first.id+'/enviar',token,'POST')
        assert.equal(order.envio_proceso,'CREADO')
        assert.equal((await ok('/ordenes/'+first.id+'/enviar',token,'POST')).num_envio,order.num_envio)
        assert.equal((await ok('/ordenes/'+first.id+'/rastrear',token,'POST')).estado_envio,1)
        assert.equal((await ok('/ordenes',token)).length,1)
    })
    await t.test('Denegación, cancelación y vencimiento devuelven reserva',async()=>{
        await ok('/carrito/fusionar',token,'POST',{items:[{idVariante:variant.id_variante,cantidad:2}]})
        const before=await stock()
        let {order}=await prepare()
        order=await ok('/ordenes/'+order.id+'/pagar',token,'POST',{...card,numeroTarjeta:'4001000000000001'})
        assert.equal(order.estado_de_pagado,'DENEGADO')
        assert.equal(await stock(),before)
        order=(await prepare()).order
        await ok('/ordenes/'+order.id+'/cancelar',token,'POST')
        await ok('/ordenes/'+order.id+'/cancelar',token,'POST')
        assert.equal(await stock(),before)
        order=(await prepare()).order
        await query("UPDATE orden SET vence_en=NOW()-INTERVAL '1 minute' WHERE id=$1",[order.id])
        await expireReservations()
        assert.equal((await ok('/ordenes/'+order.id,token)).estado_de_pagado,'CANCELADO')
        assert.equal(await stock(),before)
    })
    await t.test('Servicios live locales: exactamente un cobro/envío y misma orden en rastreo',async()=>{
        const host='127.0.0.1:'+provider.address().port
        await query('UPDATE courier SET host=$1',[host]);await query('UPDATE tarjeta SET host=$1',[host])
        process.env.EXTERNAL_SERVICES_MODE='live'
        const {order}=await prepare()
        await ok('/ordenes/'+order.id+'/pagar',token,'POST',card)
        await ok('/ordenes/'+order.id+'/pagar',token,'POST',card)
        assert.equal(payCount,1)
        await ok('/ordenes/'+order.id+'/enviar',token,'POST')
        await ok('/ordenes/'+order.id+'/enviar',token,'POST')
        assert.equal(shipCount,1)
        const tracked=await ok('/ordenes/'+order.id+'/rastrear',token,'POST')
        assert.equal(tracked.estado_envio,4)
        assert.equal(lastSent,lastTracked)
        assert.equal(lastTracked,String(order.id))
        assert.equal(tracked.num_autorizacion,'000123')
    })
    await t.test('Respuesta incierta no repite cobro; conciliación solo administrador',async()=>{
        ambiguousPay=true
        await ok('/carrito/fusionar',token,'POST',{items:[{idVariante:variant.id_variante,cantidad:2}]})
        const before=await stock(),{order}=await prepare()
        let result=await ok('/ordenes/'+order.id+'/pagar',token,'POST',card)
        assert.equal(result.estado_de_pagado,'REVISION')
        await ok('/ordenes/'+order.id+'/pagar',token,'POST',card)
        assert.equal(payCount,2)
        assert.equal((await http('/ordenes/'+order.id+'/cancelar',token,'POST')).status,409)
        assert.equal((await http('/admin/ordenes/'+order.id+'/resolver',token,'POST',{})).status,403)
        await ok('/admin/ordenes/'+order.id+'/resolver',admin,'POST',{tipo:'pago',estado:'DENEGADO',confirmado:true,nota:'Emisor local confirma que no hubo autorización'})
        assert.equal(await stock(),before)
        assert.equal((await http('/admin/ordenes/'+order.id+'/resolver',admin,'POST',{tipo:'pago',estado:'DENEGADO',confirmado:true,nota:'Duplicado'})).status,409)
    })
    await t.test('Envío incierto conserva pago y no se repite',async()=>{
        ambiguousPay=false;ambiguousShip=true
        const {order}=await prepare()
        await ok('/ordenes/'+order.id+'/pagar',token,'POST',card)
        assert.equal((await ok('/ordenes/'+order.id+'/enviar',token,'POST')).envio_proceso,'REVISION')
        await ok('/ordenes/'+order.id+'/enviar',token,'POST')
        assert.equal(shipCount,2)
        await ok('/admin/ordenes/'+order.id+'/resolver',admin,'POST',{tipo:'envio',referencia:'GUIA-CONFIRMADA',confirmado:true,nota:'Courier local confirma recepción'})
        assert.equal((await ok('/ordenes/'+order.id,token)).num_envio,'GUIA-CONFIRMADA')
    })
    await t.test('Administración y cuentas desactivadas',async()=>{
        const c=await ok('/admin/categorias',admin,'POST',{nombre:'Pruebas'})
        await ok('/admin/categorias/'+c.id,admin,'PUT',{nombre:'Pruebas editadas'})
        await ok('/admin/categorias/'+c.id,admin,'DELETE')
        assert.equal((await http('/admin/categorias/1',admin,'DELETE')).status,409)
        await ok('/admin/clientes/'+id,admin,'DELETE')
        assert.equal((await http('/carrito',token)).status,401)
    })
})
