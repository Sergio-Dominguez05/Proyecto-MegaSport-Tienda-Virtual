import test from 'node:test'
import assert from 'node:assert/strict'
process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/test'
const { pool } = await import('../dist/config/database.js')
const { quoteAllCouriers, requestShipment, requestShipmentStatus, authorizeCard } = await import('../dist/services/integrationService.js')

test('integraciones: wrappers/alias JSON/XML, couriers y tarjetas tolerantes', async () => {
 const originalFetch = globalThis.fetch
 const originalQuery = pool.query
 const oldMode = process.env.EXTERNAL_SERVICES_MODE
 process.env.EXTERNAL_SERVICES_MODE = 'live'
 const courier = { identificador: '000000000000001', nombre: 'Courier de prueba',
 host: 'http://courier.test', script_de_consulta: '/ws/consulta.php',
 script_de_envio: '/ws/envio.php', script_de_status: '/ws/status.php', formato: 'JSON' }
 const visa = { identificador:'VISA', nombre:'Visa prueba', host:'http://visa.test',
  script_de_autorizacion:'/autorizacion', formato:'JSON' }
 pool.query = async (sql) => ({ rows: String(sql).includes('FROM tarjeta') ? [visa] : [courier] })
 let calls = 0
 const serve = (body, status=200, type='application/json') => {
  globalThis.fetch = async (url) => {
   calls++
   return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status, headers: { 'content-type': type }
   })
  }
 }
 try {
  for (const body of [
   { cobertura: true, costo: '25.00' },
   { consultaprecio: { courrier: '000000000000001', cobertura: 'TRUE', costo: '25.00' } },
   { respuesta: { datos: { coverage: 'yes', tarifa: 'Q 25.00' } } },
  ]) {
   serve(body)
   const [q] = await quoteAllCouriers('01001')
   assert.equal(q.estadoConsulta, 'DISPONIBLE')
   assert.equal(q.costoEnvio, 25)
   assert.equal(q.courierName, courier.nombre)
  }

  serve('<consultaprecio><cobertura>TRUE</cobertura><costo>25.00</costo></consultaprecio>',200,'application/xml')
  assert.equal((await quoteAllCouriers('01001','XML'))[0].costoEnvio,25)

  serve({ respuesta:{ cobertura: 'FALSE', costo: '0.00' } })
  assert.equal((await quoteAllCouriers('01001'))[0].estadoConsulta,'SIN_COBERTURA')

  for (const body of [{}, { consultaprecio: { cobertura: 'maybe' } },
   { cobertura: true }, { cobertura: true, costo: -1 }, { cobertura:true,costo:true }]) {
   serve(body)
   assert.equal((await quoteAllCouriers('01001'))[0].estadoConsulta,'ERROR')
  }

  globalThis.fetch = async () => { throw new Error('connection refused') }
  assert.equal((await quoteAllCouriers('01001'))[0].estadoConsulta,'ERROR')

  serve({envio:{status:'ACEPTADO',guia:'GUA-00001'}})
  const shipment = await requestShipment(courier.identificador,{
   orden:'1',destinatario:'Prueba',destino:'01001',direccion:'Direccion de prueba'
  })
  assert.equal(shipment.numeroEnvio,'GUA-00001')

  // Some implementations accept the shipment but do not return a guide/tracking number.
  serve({respuesta:{datos:{estado:'SOLICITADO'}}})
  const withoutGuide = await requestShipment(courier.identificador,{
   orden:'77',destinatario:'Prueba',destino:'01001',direccion:'Direccion de prueba'
  })
  assert.equal(withoutGuide.numeroEnvio,'77')
  assert.equal(withoutGuide.estadoEnvio,1)

  serve({envio:{status:'RECHAZADO',guia:'0'}})
  await assert.rejects(requestShipment(courier.identificador,{
   orden:'1',destinatario:'Prueba',destino:'01001',direccion:'Direccion de prueba'
  }),/rechazó/)

  for (const [remoteStatus,expected] of [
   ['Surtiéndose',2],['3 - Empacándose',3],['En tránsito',4],['DELIVERED',5],['Registrado',1],
  ]) {
   serve({respuesta:{orden:{estatus:remoteStatus}}})
   assert.equal((await requestShipmentStatus(courier.identificador,'1')).estadoEnvio,expected)
  }

  serve({autorizacion:{status:'APROBADO',numero:'A-100',emisor:'VISA'}})
  assert.equal((await authorizeCard({
   tarjeta:'4000000000000002',nombre:'Prueba',fechaVencimiento:'202812',numeroSeguridad:'123',monto:25
  })).authorizationNumber,'A-100')

  serve({respuesta:{datos:{resultado:'AUTORIZADA',codigo:'A-200',issuer:'VISA'}}})
  const authorized = await authorizeCard({
   tarjeta:'4000000000000002',nombre:'Prueba',fechaVencimiento:'202812',numeroSeguridad:'123',monto:25
  })
  assert.equal(authorized.status,'APROBADO')
  assert.equal(authorized.authorizationNumber,'A-200')

  serve({respuesta:{estatus:'RECHAZADA',motivo:'Fondos insuficientes',codigo:'0'}},402)
  const denied = await authorizeCard({
   tarjeta:'4000000000000002',nombre:'Prueba',fechaVencimiento:'202812',numeroSeguridad:'123',monto:25
  })
  assert.equal(denied.status,'DENEGADO')
  assert.equal(denied.authorizationNumber,null)
  assert.equal(denied.message,'Fondos insuficientes')

  assert.ok(calls>=18)
 } finally {
  globalThis.fetch = originalFetch
  pool.query = originalQuery
  if (oldMode===undefined) delete process.env.EXTERNAL_SERVICES_MODE
  else process.env.EXTERNAL_SERVICES_MODE = oldMode
 }
})
