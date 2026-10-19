-- Datos de demostración. Cada tabla se llena solo si está vacía, para no repetir
-- registros ni revivir los que se hayan eliminado.

INSERT INTO citas.cliente (nombre, documento, telefono, correo)
SELECT * FROM (VALUES
    ('Carlos Ramírez', '1098765432', '3001234567', 'carlos.ramirez@correo.com'),
    ('Mateo Herrera',  '1087654321', '3012345678', 'mateo.herrera@correo.com'),
    ('Santiago López', '1076543210', '3023456789', CAST(NULL AS VARCHAR(255)))
) AS demo (nombre, documento, telefono, correo)
WHERE NOT EXISTS (SELECT 1 FROM citas.cliente);

-- De lunes a sábado de 9:00 a. m. a 7:00 p. m.; el domingo no se atiende
INSERT INTO citas.horario (dia_semana, apertura, cierre)
SELECT * FROM (VALUES
    (1, TIME '09:00', TIME '19:00'),
    (2, TIME '09:00', TIME '19:00'),
    (3, TIME '09:00', TIME '19:00'),
    (4, TIME '09:00', TIME '19:00'),
    (5, TIME '09:00', TIME '19:00'),
    (6, TIME '09:00', TIME '19:00'),
    (7, CAST(NULL AS TIME), CAST(NULL AS TIME))
) AS demo (dia_semana, apertura, cierre)
WHERE NOT EXISTS (SELECT 1 FROM citas.horario);
