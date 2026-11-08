// Middlewares de autenticación (¿quién eres?) y autorización (¿puedes hacerlo?)
import type { RequestHandler } from 'express';
import type { TokenService, PayloadToken } from '../../application/ports/token-service.js';
import { rolCubre } from '../../domain/rol.js';
import type { Rol } from '../../domain/rol.js';
import { AppError } from '../../../../shared/errors/app-error.js';

// Después de `autenticar`, la petición lleva al usuario del token.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: PayloadToken;
    }
  }
}

const NO_AUTENTICADO = 'Debes iniciar sesión';

export function crearAutenticar(tokens: TokenService): RequestHandler {
  return (req, _res, next) => {
    const cabecera = req.headers.authorization ?? '';
    const [esquema, token, ...resto] = cabecera.split(' ');
    if (esquema !== 'Bearer' || !token || resto.length > 0) {
      next(new AppError(401, NO_AUTENTICADO));
      return;
    }
    // Solo se verifica la firma y el vencimiento; no se consulta la base de datos.
    // Límite conocido: un usuario desactivado conserva su token hasta que venza (1 hora).
    const payload = tokens.verificar(token);
    if (!payload) {
      next(new AppError(401, 'La sesión no es válida o ya venció'));
      return;
    }
    req.usuario = payload;
    next();
  };
}

// Deja pasar si el rol del usuario cubre AL MENOS UNO de los roles pedidos.
// Usa rolCubre, así el administrador hereda lo del administrativo.
export function exigirRol(...rolesPermitidos: Rol[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.usuario) {
      next(new AppError(401, NO_AUTENTICADO));
      return;
    }
    const usuario = req.usuario;
    if (!rolesPermitidos.some((requerido) => rolCubre(usuario.rol, requerido))) {
      next(new AppError(403, 'No tienes permiso para esta acción'));
      return;
    }
    next();
  };
}