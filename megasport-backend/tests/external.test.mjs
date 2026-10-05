import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {callExternalService} from '../dist/services/externalHttpService.js'
test('Contrato HTTP JSON/XML, timeout, redirecciones y respuestas inválidas',async t=>{
    const server=createServer((req,res)=>{
        const url=new URL(req.url,'http://localhost')
        if(url.pathname==='/xml'){
            res.setHeader('Content-Type','application/xml')
            return res.end('<?xml version="1.0"?><respuesta><status>APROBADO</status><numero>000123</numero></respuesta>')
        }
        if(url.pathname==='/invalid')return res.end('null')
        if(url.pathname==='/slow')return
        if(url.pathname==='/redirect'){res.writeHead(302,{Location:'/xml'});return res.end()}
        res.setHeader('Content-Type','application/json')
        res.end(JSON.stringify({nombre:url.searchParams.get('nombre'),destino:url.searchParams.get('destino')}))
    })
    server.listen(0,'127.0.0.1')
    await new Promise(r=>server.once('listening',r))
    t.after(()=>{server.closeAllConnections();server.close()})
    const host='127.0.0.1:'+server.address().port
    const json=await callExternalService(host,'/json',{nombre:'Nombre con espacios & ñ',destino:'01001'},'JSON')
    assert.equal(json.destino,'01001')
    assert.equal(json.nombre,'Nombre con espacios & ñ')
    const xml=await callExternalService(host,'/xml',{},'XML')
    assert.equal(xml.numero,'000123')
    assert.equal(xml.status,'APROBADO')
    await assert.rejects(()=>callExternalService(host,'/invalid',{},'JSON'),e=>e.status===502)
    await assert.rejects(()=>callExternalService(host,'/redirect',{},'JSON'),e=>e.status===502)
    await assert.rejects(()=>callExternalService(host,'https://otro.example/path',{},'JSON'),e=>e.status===500)
    process.env.EXTERNAL_SERVICE_TIMEOUT_MS='25'
    await assert.rejects(()=>callExternalService(host,'/slow',{},'JSON'),e=>e.status===504)
})
