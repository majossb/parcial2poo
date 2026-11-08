// Construye la aplicación Express (sin abrir el puerto, para poder probarla).
import cors from 'cors';
import express from 'express';
import type { Express } from 'express';
import type { Env } from './config/env.js';
import type { Contenedor } from './composition-root.js';
import { crearManejadorErrores, rutaNoEncontrada } from './shared/middlewares/error-handler.js';

export function crearApp(env: Env, contenedor: Contenedor): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/salud', (_req, res) => {
    res.json({ estado: 'ok' });
  });
  app.use('/api/auth', contenedor.authRouter);
  app.use('/api/asistencia', contenedor.asistenciaRouter);

  app.use(rutaNoEncontrada);
  app.use(crearManejadorErrores(contenedor.traductoresDeErrores)); // siempre al final
  return app;
}