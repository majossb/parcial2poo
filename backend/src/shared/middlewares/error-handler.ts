// Traduce los errores a respuestas HTTP en un solo lugar.
// Los controladores no capturan errores: los dejan subir hasta aquí (Express 5 reenvía
// automáticamente los rechazos de funciones async).
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import type { TraductorDeErrores } from '../errors/app-error.js';

export const rutaNoEncontrada: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
};

// `traductores` los aporta cada módulo (ver el composition-root).
export function crearManejadorErrores(traductores: readonly TraductorDeErrores[]): ErrorRequestHandler {
  return (error, _req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    if (error instanceof AppError) {
      res.status(error.estado).json({ error: error.message });
      return;
    }
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Datos inválidos',
        detalle: error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
      });
      return;
    }
    for (const traducir of traductores) {
      const traducido = traducir(error);
      if (traducido) {
        res.status(traducido.estado).json({ error: traducido.mensaje });
        return;
      }
    }
    // JSON mal formado en el cuerpo de la petición
    if (error instanceof SyntaxError && 'body' in error) {
      res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
      return;
    }
    // Cualquier otra cosa es un fallo nuestro: se registra completo, pero al cliente
    // no se le revela nada interno.
    console.error('Error no controlado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  };
}