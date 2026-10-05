export async function api<T>(path:string, method='GET', body?:unknown):Promise<T> {
    const token=localStorage.getItem('megasport-auth-token')
    const res=await fetch(`${import.meta.env.VITE_API_URL}${path}`,{
        method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
        ...(body===undefined?{}:{body:JSON.stringify(body)})
    })
    const data=await res.json()
    if(!res.ok) throw new Error(data.message??'No se pudo completar la operación')
    return data
}
