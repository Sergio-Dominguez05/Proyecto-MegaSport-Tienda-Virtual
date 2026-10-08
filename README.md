# MegaSport — Tienda Virtual

Consulta [INTEGRACION_CARRITO_Y_SERVICIOS.md](./INTEGRACION_CARRITO_Y_SERVICIOS.md) para configurar el carrito persistente y la conexión con los equipos de tarjeta y courier.

La etapa de órdenes, reservas de stock, “Mis pedidos” y administración está explicada en ORDENES_Y_ADMINISTRACION.md.

Proyecto universitario distribuido de una tienda de ropa y calzado deportivo.

## Arquitectura

- Frontend: React, TypeScript, Vite y Tailwind CSS.
- Backend: Node.js, Express y TypeScript.
- Base de datos: PostgreSQL en Supabase mediante `pg`.
- Servicios externos: proveedores de tarjeta y couriers mediante REST.

El frontend solo se comunica con Express. Las credenciales de PostgreSQL y la
comunicación con servicios externos permanecen en el backend.

## Preparación

1. Copiar `megasport-backend/.env.example` como `megasport-backend/.env` y
   completar `DATABASE_URL` y `JWT_SECRET`.
2. Copiar `megasport-forntend/.env.example` como
   `megasport-forntend/.env`.
3. En cada carpeta ejecutar `npm install`.

## Ejecución

Backend:

```bash
cd megasport-backend
npm run dev
```

Frontend, en otra terminal:

```bash
cd megasport-forntend
npm run dev
```

Abrir `http://localhost:5173`.

## Usuarios existentes

Los usuarios antiguos de prueba tienen el marcador `PENDIENTE_HASH_BACKEND`.
Para asignarles una contraseña segura desde el backend:

```bash
cd megasport-backend
npm run set-password -- admin@megasport.local "UnaContraseñaSegura"
```

El registro público crea únicamente usuarios con rol `CLIENTE`. El rol de
administrador no puede solicitarse desde el navegador.

## Verificación

```bash
cd megasport-backend && npm run build
cd ../megasport-forntend && npm run build && npm run lint
```
