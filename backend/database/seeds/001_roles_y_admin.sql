-- Datos iniciales: roles y un administrador SOLO PARA DESARROLLO
-- Correo: admin@empresa.local   Contrasena: Admin123!   (cambiarla antes de usar datos reales)
BEGIN;

INSERT INTO roles (id, nombre) VALUES
  (1, 'administrador'),
  (2, 'administrativo'),
  (3, 'supervisor'),
  (4, 'operario');

INSERT INTO usuarios (correo, password_hash, rol_id)
VALUES ('admin@empresa.local', '$2b$10$c5Pk28iRErzCDpciCgZaweVCCbbOx5uICGeSMRifssdlH1Eo8RTYa', 1);

COMMIT;
