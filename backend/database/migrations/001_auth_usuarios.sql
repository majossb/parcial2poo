-- Modulo auth: roles y usuarios (RF-01, RF-11)
BEGIN;

CREATE TABLE roles (
  id        SMALLINT    PRIMARY KEY,
  nombre    VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  correo         VARCHAR(255) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  rol_id         SMALLINT     NOT NULL REFERENCES roles (id),
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- El correo institucional es unico sin importar mayusculas o minusculas
CREATE UNIQUE INDEX uq_usuarios_correo ON usuarios (lower(correo));
CREATE INDEX idx_usuarios_rol ON usuarios (rol_id);

COMMIT;
