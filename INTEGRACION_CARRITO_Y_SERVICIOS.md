# Carrito persistente e integración con otros equipos

## Qué quedó implementado

- El carrito de un visitante se conserva temporalmente en el navegador.
- Al iniciar sesión, ese carrito se pasa a PostgreSQL/Supabase y queda asociado al usuario autenticado.
- El backend valida producto, variante y stock antes de guardar.
- El carrito usa JWT; el usuario no puede enviar manualmente otro `id_usuario`.
- MegaSport puede consultar couriers, solicitar un envío, consultar su estado y pedir autorización de tarjeta mediante el backend.
- Los hosts y scripts externos siempre se leen de las tablas `courier` y `tarjeta`.
- Las respuestas externas pueden recibirse en JSON o XML.
- El número completo de tarjeta y el código de seguridad no se guardan en la base de datos ni se escriben en los registros del servidor.

## Variables nuevas

En `megasport-backend/.env` agregar:

```env
TIENDA_ID=MEGASPORT
EXTERNAL_SERVICE_TIMEOUT_MS=8000
```


En `megasport-backend/.env` usar durante las pruebas locales:
```env

EXTERNAL_SERVICES_MODE=mock
```

Cuando los equipos de tarjeta y courier ya estén ejecutando sus servicios, cambiar solamente a:

```env

EXTERNAL_SERVICES_MODE=live
```

Después hay que detener y volver a ejecutar el frontend con `npm run dev`.

## Configurar las direcciones reales

No se escribe una IP directamente en React o Node. Se actualiza PostgreSQL:

```sql
UPDATE courier
SET host = '192.168.1.40:8080',
    script_de_consulta = '/consulta',
    script_de_envio = '/envio',
    script_de_status = '/status'
WHERE identificador = 'COUR-001';

UPDATE tarjeta
SET host = '192.168.1.25:8080',
    script_de_autorizacion = '/autorizacion'
WHERE identificador = 'VISA';
```

Si el equipo usa HTTPS, `host` puede contener, por ejemplo, `https://192.168.1.25:8443`.

## Rutas internas de MegaSport

Todas requieren `Authorization: Bearer <token>`.

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/carrito` | Obtener el carrito del usuario |
| POST | `/api/carrito/articulos` | Agregar una variante |
| PATCH | `/api/carrito/articulos/:idVariante` | Cambiar cantidad |
| DELETE | `/api/carrito/articulos/:idVariante` | Eliminar una variante |
| DELETE | `/api/carrito` | Vaciar el carrito |
| GET | `/api/integraciones/couriers/cotizaciones` | Consultar couriers activos |
| POST | `/api/integraciones/couriers/:id/envios` | Solicitar un envío |
| GET | `/api/integraciones/couriers/:id/estado` | Consultar estado 1 a 5 |
| POST | `/api/integraciones/tarjetas/autorizar` | Solicitar autorización de pago |

## Contrato que MegaSport enviará

```text
GET http://HOST/SCRIPT?destino=01001&formato=JSON

GET http://HOST/SCRIPT?orden=...&destinatario=...&destino=...&direccion=...&tienda=MEGASPORT&formato=JSON

GET http://HOST/SCRIPT?orden=...&tienda=MEGASPORT&formato=JSON

GET http://HOST/SCRIPT?tarjeta=...&nombre=...&fecha_venc=...&num_seguridad=...&monto=...&tienda=MEGASPORT&formato=JSON
```

## Primera prueba con los demás equipos

1. Confirmar IP, puerto y nombre exacto de cada script.
2. Verificar que las computadoras se vean en la misma red con `ping`.
3. Actualizar las filas de `courier` y `tarjeta` en Supabase.
4. Probar las URL externas directamente con Postman usando datos ficticios.
5. Cambiar el frontend a modo `live` y reiniciarlo.
6. Iniciar sesión en MegaSport y completar una compra de prueba.
7. Si una integración falla, revisar el mensaje mostrado; el tiempo máximo se controla con `EXTERNAL_SERVICE_TIMEOUT_MS`.

Para una entrega real debe usarse HTTPS. HTTP solo es apropiado en la red local del proyecto.
