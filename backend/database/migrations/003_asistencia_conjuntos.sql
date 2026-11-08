-- Tablas del módulo asistencia: conjuntos residenciales (centros de trabajo)
BEGIN;

CREATE TABLE conjuntos_residenciales (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     VARCHAR(150) NOT NULL UNIQUE,
  direccion  VARCHAR(200),
  activo     BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMIT;
