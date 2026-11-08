-- Datos de DEMO para probar asistencia mientras hojas-de-vida no tenga sus rutas.
-- SOLO DESARROLLO. Contrasenas: Operario123! / Administrativo123! / Supervisor123!
BEGIN;

INSERT INTO usuarios (correo, password_hash, rol_id) VALUES
  ('operario@empresa.local',       '$2b$10$goLuz.xi/E2rs2tpNNwei.J5NQLsqcBzBwRXw/ugujHruTvIl4qOi', 4),
  ('administrativo@empresa.local', '$2b$10$m.x32wWB7wTFHquL4ltLPOhkhsIZv1LX/w12Hopui7rVsNUrgo1Ki', 2),
  ('supervisor@empresa.local',     '$2b$10$jF0jRm5i/m0S8z.IiQ1t5OePJWcpkXaxUhGXU6N5HOWLhzNx4tqmS', 3)
ON CONFLICT (lower(correo)) DO NOTHING;

INSERT INTO operarios (usuario_id, documento_identidad, nombres, apellidos, telefono, cargo, fecha_ingreso)
SELECT id, '1000000001', 'Juan', 'Perez', '3000000000', 'Operario de jardineria', DATE '2026-01-15'
  FROM usuarios
 WHERE lower(correo) = 'operario@empresa.local'
ON CONFLICT (documento_identidad) DO NOTHING;

COMMIT;