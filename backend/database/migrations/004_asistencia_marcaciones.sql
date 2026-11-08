-- Tablas del módulo asistencia: marcaciones (id UUID, hora del dispositivo, hora de recepción)
BEGIN;

CREATE TABLE marcaciones (
  -- El id lo genera el dispositivo (UUID). Al ser llave primaria, un reenvio
  -- de la misma marcacion no se puede duplicar.
  id                         UUID        PRIMARY KEY,
  operario_id                UUID        NOT NULL REFERENCES operarios (id),
  conjunto_id                UUID        NOT NULL REFERENCES conjuntos_residenciales (id),
  tipo                       VARCHAR(10) NOT NULL,
  registrada_en_dispositivo  TIMESTAMPTZ NOT NULL,
  recibida_en_servidor       TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado_revision            VARCHAR(10) NOT NULL DEFAULT 'normal',
  CONSTRAINT ck_marcaciones_tipo   CHECK (tipo IN ('entrada', 'salida')),
  CONSTRAINT ck_marcaciones_estado CHECK (estado_revision IN ('normal', 'a_revisar'))
);

-- Consultas del historial y calculo de la jornada de un operario
CREATE INDEX idx_marcaciones_operario_hora
  ON marcaciones (operario_id, registrada_en_dispositivo DESC);

-- Consultas por conjunto
CREATE INDEX idx_marcaciones_conjunto_hora
  ON marcaciones (conjunto_id, registrada_en_dispositivo DESC);

-- Marcaciones que requieren revision por diferencia de reloj
CREATE INDEX idx_marcaciones_a_revisar
  ON marcaciones (estado_revision)
  WHERE estado_revision = 'a_revisar';

COMMIT;
