export type PersistedOrder={
    id:string; estado_de_pagado:string; envio_proceso:string; modo:'mock'|'live'
    total:string; subtotal_antes_de_envio:string; costo_envio:string; creado_en:string
    destinatario:string; direccion_de_envio:string; codigo_del_destino:string
    num_autorizacion:string|null; num_envio:string|null; estado_envio:1|2|3|4|5
    id_courier:string; nota_revision:string|null; vence_en:string
    detalles:{id:number;nombre_producto:string;sku:string;talla:string;color:string;precio_por_unidad:string;cantidad_de_articulos:number}[]
}
