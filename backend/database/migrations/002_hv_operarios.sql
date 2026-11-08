-- Tablas del módulo hojas-de-vida: operarios y su hoja de vida
-- Modulo hojas-de-vida: operarios y experiencia laboral (RF-02, RF-03, RF-04, RF-05)
BEGIN;

CREATE TABLE operarios (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id           UUID         NOT NULL UNIQUE REFERENCES usuarios (id),
  documento_identidad  VARCHAR(20)  NOT NULL UNIQUE,
  nombres              VARCHAR(100) NOT NULL,
  apellidos            VARCHAR(100) NOT NULL,
  telefono             VARCHAR(20),
  direccion            VARCHAR(200),
  cargo                VARCHAR(100) NOT NULL,
  fecha_ingreso        DATE         NOT NULL,
  activo               BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en            TIMESTAMPTZ  NOT NULL DEFAULT now(),
  actualizado_en       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_operarios_activo ON operarios (activo);

CREATE TABLE experiencias_laborales (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  operario_id  UUID         NOT NULL REFERENCES operarios (id),
  empresa      VARCHAR(150) NOT NULL,
  cargo        VARCHAR(100) NOT NULL,
  fecha_inicio DATE         NOT NULL,
  fecha_fin    DATE,
  descripcion  TEXT,
  CONSTRAINT ck_experiencia_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_experiencias_operario ON experiencias_laborales (operario_id);

COMMIT;
