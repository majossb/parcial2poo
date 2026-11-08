// Rutas de hojas de vida. Se montan bajo /api/hojas-de-vida.
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { exigirRol } from '../../../auth/index.js';
import type { HojasDeVidaController } from './hojas-de-vida.controller.js';

export function crearHojasDeVidaRouter(
    controller: HojasDeVidaController,
    autenticar: RequestHandler,
): Router {
    const router = Router();
  // Consultar: administrativos (y el administrador, que los hereda) y supervisores
    router.get('/operarios', autenticar, exigirRol('administrativo', 'supervisor'), controller.listar);
    router.get('/operarios/:id', autenticar, exigirRol('administrativo', 'supervisor'), controller.consultar);
  // Modificar: solo administrativos y el administrador
    router.post('/operarios', autenticar, exigirRol('administrativo'), controller.registrar);
    router.put('/operarios/:id', autenticar, exigirRol('administrativo'), controller.actualizar);
    router.patch('/operarios/:id/estado', autenticar, exigirRol('administrativo'), controller.cambiarEstado);
    router.post('/operarios/:id/experiencias', autenticar, exigirRol('administrativo'), controller.nuevaExperiencia);
    return router;
}