# Órdenes, stock y administración

## Instalación de esta etapa

1. Ejecuta database/03_ordenes.sql una sola vez en el SQL Editor de Supabase.
2. No vuelvas a ejecutar 01_schema.sql sobre una base que ya tiene datos.
3. En el backend instala dependencias con npm install.
4. En megasport-backend/.env deja inicialmente EXTERNAL_SERVICES_MODE=mock.

Con mock se prueban órdenes sin usar tarjetas reales ni llamar a equipos externos.

## Flujo de una compra

1. El usuario agrega productos y selecciona un courier.
2. MegaSport cotiza nuevamente en el backend.
3. El backend calcula el total usando los precios de la base de datos.
4. Se crea la orden y se reserva el stock durante 20 minutos.
5. El pago se intenta una sola vez.
6. Si se aprueba, se vacía el carrito y la orden queda pagada.
7. Si se deniega, se devuelve el stock.
8. Si vence o se cancela, se devuelve el stock.
9. Si el proveedor responde de forma incierta, la orden queda en REVISION; no se repite automáticamente el cobro.

## Administración

Un usuario con rol ADMINISTRADOR puede abrir /admin y mantener categorías, productos, variantes, existencias, clientes, couriers, emisores de tarjeta y conciliaciones manuales.

Las desactivaciones se prefieren a eliminar registros que ya tengan historial.

## Mis pedidos

La ruta /pedidos consulta las órdenes desde PostgreSQL. La pantalla de cada orden permite cancelar una reserva, solicitar el envío una vez y consultar su estado.

Si una integración queda en REVISION, el administrador debe confirmar primero con el equipo externo. Después puede registrar la autorización o la guía desde /admin; esa conciliación no repite la llamada externa.

## Pruebas automatizadas

Desde megasport-backend ejecuta npm test. Las pruebas usan PGlite y un servidor HTTP local aislado. No utilizan Supabase, tarjetas reales ni couriers reales.
