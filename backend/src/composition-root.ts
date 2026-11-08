// Composition root: el único lugar que conoce todos los módulos y conecta
// cada puerto con su adaptador concreto.
import type { RequestHandler, Router } from 'express';
import type { Env } from './config/env.js';
import type { Pool } from './shared/database/pool.js';
import {
  AuthController,
  BcryptPasswordHasher,
  CerrarSesion,
  CrearUsuario,
  IniciarSesion,
  JwtTokenService,
  PostgresUsuarioRepository,
  crearAuthRouter,
  crearAutenticar,
} from './modules/auth/index.js';

export interface Contenedor {
  readonly authRouter: Router;
  // Los demás módulos los usarán para proteger sus rutas.
  readonly autenticar: RequestHandler;
}

export function componer(env: Env, pool: Pool): Contenedor {
  // --- auth ---
  const hasher = new BcryptPasswordHasher();
  const tokens = new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN);
  const usuarios = new PostgresUsuarioRepository(pool);
  const autenticar = crearAutenticar(tokens);
  const authController = new AuthController(
    new IniciarSesion(usuarios, hasher, tokens),
    new CerrarSesion(),
    new CrearUsuario(usuarios, hasher),
  );
  const authRouter = crearAuthRouter(authController, autenticar);

  // Aquí se irán conectando hojas-de-vida y asistencia.
  return { authRouter, autenticar };
}