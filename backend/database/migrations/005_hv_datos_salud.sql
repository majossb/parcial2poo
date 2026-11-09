-- Modulo hojas-de-vida: datos personales, de salud y de emergencia del operario
BEGIN;

-- Se permiten vacíos porque los operarios ya registrados no tienen estos datos
ALTER TABLE operarios
  ADD COLUMN fecha_nacimiento             DATE,
  ADD COLUMN tipo_sangre                  VARCHAR(3),
  ADD COLUMN eps                          VARCHAR(100),
  ADD COLUMN arl                          VARCHAR(100),
  ADD COLUMN contacto_emergencia_nombre   VARCHAR(150),
  ADD COLUMN contacto_emergencia_telefono VARCHAR(20);

ALTER TABLE operarios
  ADD CONSTRAINT ck_operarios_tipo_sangre
  CHECK (tipo_sangre IS NULL OR tipo_sangre IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'));

COMMIT;