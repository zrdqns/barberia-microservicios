-- Datos de demostración. Cada tabla se llena solo si está vacía, para no repetir
-- registros ni revivir los que se hayan eliminado.

INSERT INTO catalogo.servicio (nombre, descripcion, precio, duracion_minutos, activo)
SELECT * FROM (VALUES
    ('Corte clásico',    'Corte a tijera o máquina con lavado', 25000, 30, TRUE),
    ('Arreglo de barba', 'Perfilado y afeitado con navaja',     18000, 20, TRUE),
    ('Corte y barba',    'Corte clásico más arreglo de barba',  38000, 50, TRUE),
    ('Tinte',            'Aplicación de color completo',        60000, 90, FALSE)
) AS demo (nombre, descripcion, precio, duracion_minutos, activo)
WHERE NOT EXISTS (SELECT 1 FROM catalogo.servicio);

INSERT INTO catalogo.barbero (nombre, documento, telefono, especialidad, activo)
SELECT * FROM (VALUES
    ('Andrés Rojas',    '1012345678', '3104567890', 'Cortes clásicos',  TRUE),
    ('Julián Mora',     '1023456789', '3115678901', 'Barba y afeitado', TRUE),
    ('Felipe Cárdenas', '1034567890', '3126789012', 'Degradados',       FALSE)
) AS demo (nombre, documento, telefono, especialidad, activo)
WHERE NOT EXISTS (SELECT 1 FROM catalogo.barbero);
