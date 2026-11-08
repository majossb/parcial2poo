// Qué código HTTP corresponde a cada error del dominio de asistencia
import type { TraductorDeErrores } from '../../../../shared/errors/app-error.js';
import { FiltroInvalidoError } from '../../application/use-cases/consultar-historial.js';
import { OperarioNoEncontradoError } from '../../application/use-cases/resolver-operario-del-usuario.js';

export const traducirErroresAsistencia: TraductorDeErrores = (error) => {
  if (error instanceof FiltroInvalidoError) return { estado: 400, mensaje: error.message };
  if (error instanceof OperarioNoEncontradoError) return { estado: 403, mensaje: error.message };
  return null;
};
