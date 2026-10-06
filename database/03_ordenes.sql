-- Ejecutar una vez sobre la BD existente (no volver a ejecutar 01_schema.sql).
BEGIN;
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE orden ALTER COLUMN id_tarjeta DROP NOT NULL;
ALTER TABLE orden ALTER COLUMN num_autorizacion DROP NOT NULL;
ALTER TABLE orden ALTER COLUMN num_envio DROP NOT NULL;
ALTER TABLE orden ALTER COLUMN estado_de_pagado TYPE VARCHAR(20);
ALTER TABLE orden DROP CONSTRAINT IF EXISTS orden_estado_de_pagado_check;
ALTER TABLE orden ADD CONSTRAINT orden_estado_de_pagado_check
 CHECK (estado_de_pagado IN ('PENDIENTE','PROCESANDO','REVISION','APROBADO','DENEGADO','CANCELADO'));
ALTER TABLE orden ADD COLUMN IF NOT EXISTS clave_solicitud UUID;
ALTER TABLE orden ADD COLUMN IF NOT EXISTS id_carrito INT REFERENCES carrito(id);
ALTER TABLE orden ADD COLUMN IF NOT EXISTS destinatario VARCHAR(150);
ALTER TABLE orden ADD COLUMN IF NOT EXISTS modo VARCHAR(4) NOT NULL DEFAULT 'live' CHECK (modo IN ('mock','live'));
ALTER TABLE orden ADD COLUMN IF NOT EXISTS stock_reservado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orden ADD COLUMN IF NOT EXISTS vence_en TIMESTAMPTZ;
ALTER TABLE orden ADD COLUMN IF NOT EXISTS envio_proceso VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
 CHECK (envio_proceso IN ('PENDIENTE','PROCESANDO','REVISION','CREADO'));
ALTER TABLE orden ADD COLUMN IF NOT EXISTS nota_revision TEXT;
UPDATE orden SET envio_proceso = 'CREADO' WHERE num_envio IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orden_solicitud_unica ON orden(id_usuario, clave_solicitud);
CREATE UNIQUE INDEX IF NOT EXISTS orden_compra_activa ON orden(id_usuario)
 WHERE estado_de_pagado IN ('PENDIENTE','PROCESANDO','REVISION');
ALTER TABLE detalle_orden ADD COLUMN IF NOT EXISTS nombre_producto VARCHAR(150);
ALTER TABLE detalle_orden ADD COLUMN IF NOT EXISTS sku VARCHAR(50);
ALTER TABLE detalle_orden ADD COLUMN IF NOT EXISTS talla VARCHAR(20);
ALTER TABLE detalle_orden ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE detalle_orden ADD COLUMN IF NOT EXISTS url_img VARCHAR(500);
UPDATE detalle_orden d SET nombre_producto=p.nombre, sku=v.sku, talla=v.talla, color=v.color, url_img=p.url_img
 FROM variante_producto v JOIN producto p ON p.id=v.id_producto
 WHERE d.id_variante=v.id_variante AND d.nombre_producto IS NULL;
COMMIT;
