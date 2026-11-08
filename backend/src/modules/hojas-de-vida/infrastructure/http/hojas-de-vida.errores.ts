// Qué código HTTP corresponde a cada error del dominio de hojas de vida
import type { TraductorDeErrores } from '../../../../shared/errors/app-error.js';
import { OperarioInvalidoError, OperarioNoEncontradoError } from '../../domain/operario.js';
import { ExperienciaInvalidaError } from '../../domain/hoja-de-vida.js';
import { CuentaInvalidaError } from '../../application/ports/cuentas-usuario.js';
import { OperarioDuplicadoError } from '../../application/use-cases/registrar-operario.js';

export const traducirErroresHojasDeVida: TraductorDeErrores = (error) => {
    if (error instanceof OperarioInvalidoError) return { estado: 400, mensaje: error.message };
    if (error instanceof ExperienciaInvalidaError) return { estado: 400, mensaje: error.message };
    if (error instanceof CuentaInvalidaError) return { estado: 400, mensaje: error.message };
    if (error instanceof OperarioDuplicadoError) return { estado: 409, mensaje: error.message };
    if (error instanceof OperarioNoEncontradoError) return { estado: 404, mensaje: error.message };
    return null;
};