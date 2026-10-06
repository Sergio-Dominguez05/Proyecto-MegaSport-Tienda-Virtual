BEGIN;

INSERT INTO categoria (nombre)
VALUES ('Hombre'), ('Mujer'), ('Niños'), ('Zapatos')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO producto (id_categoria, url_img, activo, nombre, descripcion, precio)
SELECT c.id, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80', TRUE,
       'Camiseta Running Pro', 'Camiseta deportiva ligera para entrenamiento y running.', 249.99
FROM categoria c
WHERE c.nombre = 'Hombre'
  AND NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Camiseta Running Pro');

INSERT INTO producto (id_categoria, url_img, activo, nombre, descripcion, precio)
SELECT c.id, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80', TRUE,
       'Sudadera Training', 'Sudadera deportiva cómoda para entrenamiento y uso diario.', 349.99
FROM categoria c
WHERE c.nombre = 'Hombre'
  AND NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Sudadera Training');

INSERT INTO producto (id_categoria, url_img, activo, nombre, descripcion, precio)
SELECT c.id, 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=700&q=80', TRUE,
       'Leggings Performance', 'Leggings deportivos flexibles para entrenamiento.', 299.99
FROM categoria c
WHERE c.nombre = 'Mujer'
  AND NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Leggings Performance');

INSERT INTO producto (id_categoria, url_img, activo, nombre, descripcion, precio)
SELECT c.id, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80', TRUE,
       'Tenis Performance X1', 'Calzado deportivo para entrenamiento y uso diario.', 599.99
FROM categoria c
WHERE c.nombre = 'Zapatos'
  AND NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Tenis Performance X1');

INSERT INTO producto (id_categoria, url_img, activo, nombre, descripcion, precio)
SELECT c.id, 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=700&q=80', TRUE,
       'Camiseta Junior Sport', 'Camiseta deportiva cómoda para niños y niñas.', 179.99
FROM categoria c
WHERE c.nombre = 'Niños'
  AND NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Camiseta Junior Sport');

INSERT INTO variante_producto (id_producto, talla, activo, sku, stock, stock_minimo, color)
SELECT p.id, values_to_insert.talla, TRUE, values_to_insert.sku, values_to_insert.stock,
       values_to_insert.stock_minimo, values_to_insert.color
FROM producto p
JOIN (
    VALUES
        ('Camiseta Running Pro', 'S', 'CAM-RUN-S-NEG', 8, 2, 'Negro'),
        ('Camiseta Running Pro', 'M', 'CAM-RUN-M-NEG', 5, 2, 'Negro'),
        ('Camiseta Running Pro', 'L', 'CAM-RUN-L-AZU', 0, 2, 'Azul'),
        ('Sudadera Training', 'M', 'SUD-TRA-M-GRI', 4, 2, 'Gris'),
        ('Sudadera Training', 'L', 'SUD-TRA-L-GRI', 2, 2, 'Gris'),
        ('Leggings Performance', 'S', 'LEG-PER-S-NEG', 7, 2, 'Negro'),
        ('Leggings Performance', 'M', 'LEG-PER-M-NEG', 6, 2, 'Negro'),
        ('Tenis Performance X1', '40', 'TEN-X1-40-ROJ', 5, 1, 'Rojo'),
        ('Tenis Performance X1', '41', 'TEN-X1-41-ROJ', 3, 1, 'Rojo'),
        ('Tenis Performance X1', '42', 'TEN-X1-42-ROJ', 0, 1, 'Rojo'),
        ('Camiseta Junior Sport', '8', 'CAM-JUN-8-AZU', 6, 2, 'Azul'),
        ('Camiseta Junior Sport', '10', 'CAM-JUN-10-AZU', 4, 2, 'Azul')
) AS values_to_insert(producto, talla, sku, stock, stock_minimo, color)
ON p.nombre = values_to_insert.producto
ON CONFLICT (sku) DO NOTHING;

INSERT INTO courier (identificador, activo, nombre, host, script_de_consulta, script_de_envio, script_de_status)
VALUES
    ('COUR-001', TRUE, 'Envios Expresso', '192.168.50.11', '/consulta', '/envio', '/status'),
    ('COUR-002', TRUE, 'Entregas Rapiditas', '192.168.50.12', '/consulta', '/envio', '/status'),
    ('COUR-003', TRUE, 'Winnie Express', '192.168.50.13', '/consulta', '/envio', '/status')
ON CONFLICT (identificador) DO NOTHING;

INSERT INTO tarjeta (identificador, activo, nombre, host, script_de_autorizacion)
VALUES
    ('VISA', TRUE, 'VISA', '192.168.60.11', '/autorizacion'),
    ('MASTERCARD', TRUE, 'MASTERCARD', '192.168.60.12', '/autorizacion'),
    ('AMERICANEXPRESS', TRUE, 'AMERICAN EXPRESS', '192.168.60.13', '/autorizacion'),
    ('CREDOMATIC', TRUE, 'CREDOMATIC', '192.168.60.14', '/autorizacion')
ON CONFLICT (identificador) DO NOTHING;

INSERT INTO usuario (hash_contrasena, rol, direccion, codigo_de_destino, telefono, nombre, email)
VALUES (
    'PENDIENTE_HASH_BACKEND',
    'ADMINISTRADOR',
    'MegaSport - Ciudad de Guatemala',
    '01001',
    '00000000',
    'Administrador MegaSport',
    'admin@megasport.local'
)
ON CONFLICT (email) DO NOTHING;

COMMIT;
