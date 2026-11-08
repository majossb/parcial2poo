// Qué código HTTP corresponde a cada error del dominio de auth
import type { TraductorDeErrores } from '../../../../shared/errors/app-error.js';
import {
  CorreoYaRegistradoError,
  CredencialesInvalidasError,
  DatosUsuarioInvalidosError,
} from '../../domain/usuario.js';

export const traducirErroresAuth: TraductorDeErrores = (error) => {
  if (error instanceof CredencialesInvalidasError) return { estado: 401, mensaje: error.message };
  if (error instanceof CorreoYaRegistradoError) return { estado: 409, mensaje: error.message };
  if (error instanceof DatosUsuarioInvalidosError) return { estado: 400, mensaje: error.message };
  return null;
};