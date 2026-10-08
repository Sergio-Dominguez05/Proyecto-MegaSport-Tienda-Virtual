import test from 'node:test'
import assert from 'node:assert/strict'
process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/test'
const { pool } = await import('../dist/config/database.js')
const { quoteAllCouriers, requestShipment, requestShipmentStatus } = await import('../dist/services/integrationService.js')

test('couriers: contratos JSON/XML, cobertura negativa y errores diferenciados', async () => {
 const originalFetch = globalThis.fetch
 const originalQuery = pool.query
 const oldMode = process.env.EXTERNAL_SERVICES_MODE
 process.env.EXTERNAL_SERVICES_MODE = 'live'
 const courier = { identificador: '000000000000001', nombre: 'Courier de prueba',
 host: 'http://courier.test', script_de_consulta: '/ws/consulta.php',
 script_de_envio: '/ws/envio.php', script_de_status: '/ws/status.php', formato: 'JSON' }
 pool.query = async () => ({ rows: [courier] })
 let calls = 0
 const serve = (body, status=200, type='application/json') => {
  globalThis.fetch = async (url) => {
   calls++
   assert.equal(url.searchParams.get('destino') ?? '01001', '01001')
   return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status, headers: { 'content-type': type }
   })
  }
 }
 try {
  for (const body of [
   { cobertura: true, costo: '25.00' },
   { consultaprecio: { courrier: '000000000000001', cobertura: 'TRUE', costo: '25.00' } },
   { consultaprecio: { cobertura: ' true ', costo: 25 } },
  ]) {
   serve(body)
   const [q] = await quoteAllCouriers('01001')
   assert.equal(q.estadoConsulta, 'DISPONIBLE')
   assert.equal(q.costoEnvio, 25)
   assert.equal(q.courierName, courier.nombre)
  }
  serve('<consultaprecio><cobertura>TRUE</cobertura><costo>25.00</costo></consultaprecio>',200,'application/xml')
  assert.equal((await quoteAllCouriers('01001','XML'))[0].costoEnvio,25)
  serve({ consultaprecio: { cobertura: 'FALSE', costo: '0.00' } })
  assert.equal((await quoteAllCouriers('01001'))[0].estadoConsulta,'SIN_COBERTURA')
  for (const body of [{}, { consultaprecio: { cobertura: 'maybe' } },
   { cobertura: true }, { cobertura: true, costo: -1 }, { cobertura:true,costo:true }]) {
   serve(body)
   assert.equal((await quoteAllCouriers('01001'))[0].estadoConsulta,'ERROR')
  }
  serve('no existe',404)
  assert.match((await quoteAllCouriers('01001'))[0].mensaje,/404/)
  globalThis.fetch = async () => { throw new Error('connection refused') }
  assert.equal((await quoteAllCouriers('01001'))[0].estadoConsulta,'ERROR')
  serve({envio:{status:'ACEPTADO',guia:'GUA-00001'}})
  const shipment = await requestShipment(courier.identificador,{
   orden:'1',destinatario:'Prueba',destino:'01001',direccion:'Direccion de prueba'
  })
  assert.equal(shipment.numeroEnvio,'GUA-00001')
  serve({envio:{status:'RECHAZADO',guia:'0'}})
  await assert.rejects(requestShipment(courier.identificador,{
   orden:'1',destinatario:'Prueba',destino:'01001',direccion:'Direccion de prueba'
  }),/rechazó/)
  serve({orden:{status:'Surtiéndose'}})
  assert.equal((await requestShipmentStatus(courier.identificador,'1')).estadoEnvio,2)
  assert.ok(calls>=14)
 } finally {
  globalThis.fetch = originalFetch
  pool.query = originalQuery
  if (oldMode===undefined) delete process.env.EXTERNAL_SERVICES_MODE
  else process.env.EXTERNAL_SERVICES_MODE = oldMode
 }
})
