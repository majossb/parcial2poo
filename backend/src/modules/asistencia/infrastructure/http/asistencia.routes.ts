// Rutas de asistencia. Se montan bajo /api/asistencia.
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { exigirRol } from '../../../auth/index.js';
import type { AsistenciaController } from './asistencia.controller.js';

export function crearAsistenciaRouter(
  controller: AsistenciaController,
  autenticar: RequestHandler,
): Router {
  const router = Router();
  // Solo el operario marca y sincroniza (RF-06, RF-08).
  router.post('/marcaciones/sincronizar', autenticar, exigirRol('operario'), controller.sincronizar);
  // RF-09: el operario ve lo suyo; administrativos (y el administrador, que los hereda) y supervisores ven todo.
  router.get('/marcaciones/mias', autenticar, exigirRol('operario'), controller.mias);
  router.get('/marcaciones', autenticar, exigirRol('administrativo', 'supervisor'), controller.historial);
  // Cualquier usuario autenticado: el celular guarda la lista para usarla sin conexión.
  router.get('/conjuntos', autenticar, controller.conjuntos);
  return router;
}