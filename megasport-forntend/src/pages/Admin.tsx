import {useEffect,useState} from 'react'
import {useAuth} from '../hooks/useAuth'
import {api} from '../services/api'
type Row=Record<string,string|number|boolean|null>
const schemas:Record<string,Record<string,string>>={
    categorias:{nombre:'text'},
    productos:{id_categoria:'number',nombre:'text',descripcion:'text',precio:'number',url_img:'text',activo:'checkbox'},
    variantes:{id_producto:'number',talla:'text',color:'text',sku:'text',stock:'number',stock_minimo:'number',activo:'checkbox'},
    clientes:{nombre:'text',email:'email',telefono:'text',direccion:'text',codigo_de_destino:'text',activo:'checkbox'},
    couriers:{identificador:'text',nombre:'text',host:'text',script_de_consulta:'text',script_de_envio:'text',script_de_status:'text',activo:'checkbox'},
    tarjetas:{identificador:'text',nombre:'text',host:'text',script_de_autorizacion:'text',activo:'checkbox'}
}
export default function Admin(){
    const {user}=useAuth()
    const [section,setSection]=useState('productos')
    if(user?.rol!=='ADMINISTRADOR')return <main className="p-10">Solo administradores.</main>
    return <main className="mx-auto max-w-7xl space-y-6 px-6 py-10">
        <h1 className="text-3xl font-bold">Administración</h1>
        <nav className="flex flex-wrap gap-3">{[...Object.keys(schemas),'ordenes'].map(s=><button key={s} className={section===s?'rounded bg-slate-950 px-4 py-2 text-white':'rounded border px-4 py-2'} onClick={()=>setSection(s)}>{s}</button>)}</nav>
        <Resource key={section} section={section}/>
    </main>
}
function Resource({section}:{section:string}){
    const [rows,setRows]=useState<Row[]>([])
    const [form,setForm]=useState<Row|null>(null)
    const [editing,setEditing]=useState<string|null>(null)
    const [message,setMessage]=useState('')
    const [busy,setBusy]=useState(false)
    const [revision,setRevision]=useState(0)
    const [reconcile,setReconcile]=useState<Row|null>(null)
    const [evidence,setEvidence]=useState({tipo:'pago',estado:'APROBADO',referencia:'',nota:'',confirmado:false})
    const schema=schemas[section]
    const key=section==='variantes'?'id_variante':section==='couriers'||section==='tarjetas'?'identificador':'id'
    useEffect(()=>{let active=true;void api<Row[]>(`/admin/${section}`).then(r=>{if(active)setRows(r)}).catch(e=>{if(active)setMessage(e.message)});return()=>{active=false}},[section,revision])
    async function submit(method:string,path:string,body?:unknown){
        setBusy(true);setMessage('')
        try{await api(path,method,body);setForm(null);setReconcile(null);setRevision(n=>n+1);setMessage('Cambios guardados');window.dispatchEvent(new Event('focus'))}
        catch(e){setMessage(e instanceof Error?e.message:'No se pudo guardar')}
        finally{setBusy(false)}
    }
    return <section className="space-y-5">
        {message&&<p role="status" className="rounded bg-amber-50 p-3">{message}</p>}
        {schema&&<button className="rounded bg-slate-950 px-4 py-2 text-white" onClick={()=>{setEditing(null);setForm(Object.fromEntries(Object.entries(schema).map(([f,t])=>[f,t==='checkbox'?true:t==='number'?0:''])));setMessage('')}}>Agregar {section}</button>}
        {section==='variantes'&&<p>Stock indica unidades disponibles para nuevas compras (las reservas ya están descontadas). Stock mínimo es el umbral de alerta.</p>}
        {form&&schema&&<form onSubmit={e=>{e.preventDefault();void submit(editing?'PUT':'POST',`/admin/${section}${editing?'/'+encodeURIComponent(editing):''}`,form)}} className="grid gap-4 rounded-xl border p-5 md:grid-cols-2">
            {Object.entries(schema).filter(([f])=>!(editing&&f==='identificador')).map(([field,type])=><label key={field} className="block">{field}
                <input type={type} step={field==='precio'?'0.01':'1'} min={type==='number'?0:undefined} required={!['descripcion','url_img'].includes(field)&&type!=='checkbox'}
                    {...(type==='checkbox'?{checked:Boolean(form[field])}:{value:String(form[field]??'')})}
                    onChange={e=>setForm({...form,[field]:type==='checkbox'?e.target.checked:type==='number'?Number(e.target.value):e.target.value})}
                    className={type==='checkbox'?'ml-3':'mt-1 block w-full rounded border p-2'}/>
            </label>)}
            {!editing&&section==='clientes'&&<label>Contraseña inicial<input type="password" minLength={8} maxLength={72} required onChange={e=>setForm({...form,password:e.target.value})} className="block w-full rounded border p-2"/></label>}
            <div className="flex gap-3"><button disabled={busy} className="rounded bg-slate-950 px-5 py-2 text-white">Guardar</button><button type="button" onClick={()=>setForm(null)}>Cancelar</button></div>
        </form>}
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>
            {(section==='ordenes'?['id','cliente','total','estado_de_pagado','envio_proceso','modo']:[key,...Object.keys(schema??{}).filter(f=>f!==key)]).map(f=><th key={f} className="border-b p-3">{f}</th>)}<th>Acciones</th>
        </tr></thead><tbody>{rows.map(row=><tr key={String(row[key])} className={section==='variantes'&&Number(row.stock)<=Number(row.stock_minimo)?'bg-amber-50':''}>
            {(section==='ordenes'?['id','cliente','total','estado_de_pagado','envio_proceso','modo']:[key,...Object.keys(schema??{}).filter(f=>f!==key)]).map(f=><td key={f} className="max-w-xs border-b p-3 break-words">{typeof row[f]==='boolean'?(row[f]?'Sí':'No'):String(row[f]??'')}</td>)}
            <td className="p-3">{schema?<div className="flex gap-3">
                <button className="underline" onClick={()=>{setEditing(String(row[key]));setForm(row)}}>Editar</button>
                <button disabled={busy} className="text-red-700 underline" onClick={()=>{if(window.confirm(section==='categorias'?'¿Eliminar categoría sin productos?':'¿Desactivar este registro? Se conserva su historial.'))void submit('DELETE',`/admin/${section}/${encodeURIComponent(String(row[key]))}`)}}>{section==='categorias'?'Eliminar':'Desactivar'}</button>
            </div>:<button className="underline" onClick={()=>{setReconcile(row);setEvidence({tipo:'pago',estado:'APROBADO',referencia:'',nota:'',confirmado:false})}}>Conciliar</button>}</td>
        </tr>)}</tbody></table></div>
        {reconcile&&<form className="space-y-3 rounded border p-5" onSubmit={e=>{e.preventDefault();void submit('POST',`/admin/ordenes/${reconcile.id}/resolver`,evidence)}}>
            <h2 className="font-bold">Conciliar orden #{reconcile.id}</h2>
            <p>Solo para pagos/envíos en PROCESANDO o REVISION. Verifica primero el resultado con el otro equipo. Esta acción NO realiza otra solicitud externa.</p>
            <select value={evidence.tipo} onChange={e=>setEvidence({...evidence,tipo:e.target.value})} className="border p-2"><option value="pago">Pago</option><option value="envio">Envío ya creado</option></select>
            {evidence.tipo==='pago'&&<select className="ml-3 border p-2" value={evidence.estado} onChange={e=>setEvidence({...evidence,estado:e.target.value})}><option>APROBADO</option><option>DENEGADO</option></select>}
            {evidence.tipo==='envio'&&<select className="ml-3 border p-2" value={evidence.estado} onChange={e=>setEvidence({...evidence,estado:e.target.value})}><option value="APROBADO">Envío existente confirmado</option><option value="NO_CREADO">Courier confirma que NO existe; habilitar reintento</option></select>}
            <label className="block">Autorización / número de envío<input required={evidence.estado==='APROBADO'} value={evidence.referencia} onChange={e=>setEvidence({...evidence,referencia:e.target.value})} className="block w-full border p-2"/></label>
            <label className="block">Evidencia de la consulta<textarea required maxLength={1000} value={evidence.nota} onChange={e=>setEvidence({...evidence,nota:e.target.value})} className="block w-full border p-2"/></label>
            <label className="block"><input type="checkbox" required checked={evidence.confirmado} onChange={e=>setEvidence({...evidence,confirmado:e.target.checked})}/> Verifiqué el resultado con el proveedor.</label>
            <button disabled={busy} className="rounded bg-slate-950 px-4 py-2 text-white">Guardar conciliación</button>
        </form>}
    </section>
}
