-- Modulo hojas-de-vida: tipo de documento, especialidades y formacion del operario
BEGIN;

-- Los operarios ya registrados quedan con cédula de ciudadanía y sin especialidades
ALTER TABLE operarios
  ADD COLUMN tipo_documento VARCHAR(3) NOT NULL DEFAULT 'CC',
  ADD COLUMN especialidades TEXT[]     NOT NULL DEFAULT '{}';

ALTER TABLE operarios
  ADD CONSTRAINT ck_operarios_tipo_documento
    CHECK (tipo_documento IN ('CC', 'CE', 'PPT', 'PA')),
  ADD CONSTRAINT ck_operarios_especialidades
    CHECK (especialidades <@ ARRAY['piscinas', 'pintura', 'jardineria', 'pasillos', 'mantenimiento_general']::TEXT[]);

-- Estudios, cursos y certificaciones (algunas certificaciones vencen)
CREATE TABLE formaciones (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  operario_id       UUID         NOT NULL REFERENCES operarios (id),
  tipo              VARCHAR(20)  NOT NULL CHECK (tipo IN ('academica', 'curso', 'certificacion')),
  titulo            VARCHAR(150) NOT NULL,
  institucion       VARCHAR(150) NOT NULL,
  fecha_obtencion   DATE         NOT NULL,
  fecha_vencimiento DATE,
  CONSTRAINT ck_formacion_fechas CHECK (fecha_vencimiento IS NULL OR fecha_vencimiento >= fecha_obtencion)
);

CREATE INDEX idx_formaciones_operario ON formaciones (operario_id);

COMMIT;