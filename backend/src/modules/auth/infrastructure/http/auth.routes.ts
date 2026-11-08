// Rutas de auth. Se montan bajo /api/auth.
import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { AuthController } from './auth.controller.js';
import { exigirRol } from './auth.middleware.js';

export function crearAuthRouter(controller: AuthController, autenticar: RequestHandler): Router {
  const router = Router();
  router.post('/login', controller.login); // RF-01
  router.post('/logout', autenticar, controller.logout); // RF-01
  router.post('/usuarios', autenticar, exigirRol('administrador'), controller.crear); // RF-11
  return router;
}
