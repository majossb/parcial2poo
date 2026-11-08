// Composition root: el único lugar que conoce todos los módulos y conecta
// cada puerto con su adaptador concreto.
import type { RequestHandler, Router } from 'express';
import type { Env } from './config/env.js';
import type { Pool } from './shared/database/pool.js';
import type { TraductorDeErrores } from './shared/errors/app-error.js';
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
  traducirErroresAuth,
} from './modules/auth/index.js';
import {
  AsistenciaController,
  ConsultarHistorial,
  ListarConjuntos,
  OperariosDesdeHojasDeVida,
  PostgresConjuntoRepository,
  PostgresMarcacionRepository,
  RegistrarMarcacion,
  RelojDelSistema,
  ResolverOperarioDelUsuario,
  SincronizarMarcaciones,
  crearAsistenciaRouter,
  traducirErroresAsistencia,
} from './modules/asistencia/index.js';
// TEMPORAL: se borra cuando hojas-de-vida exporte su propio buscador de operarios.
import { OperariosTemporalPostgres } from './temporal/operarios-temporal.js';

export interface Contenedor {
  readonly authRouter: Router;
  readonly asistenciaRouter: Router;
  // Los demás módulos lo usarán para proteger sus rutas.
  readonly autenticar: RequestHandler;
  // Cada módulo aporta cómo traducir sus errores de dominio a códigos HTTP.
  readonly traductoresDeErrores: readonly TraductorDeErrores[];
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

  // --- asistencia ---
  // TEMPORAL: cambiar esta línea por el buscador que exporte hojas-de-vida.
  const operarios = new OperariosDesdeHojasDeVida(new OperariosTemporalPostgres(pool));
  const marcaciones = new PostgresMarcacionRepository(pool);
  const registrar = new RegistrarMarcacion(marcaciones, operarios, new RelojDelSistema());
  const asistenciaController = new AsistenciaController(
    new SincronizarMarcaciones(registrar),
    new ConsultarHistorial(marcaciones),
    new ListarConjuntos(new PostgresConjuntoRepository(pool)),
    new ResolverOperarioDelUsuario(operarios),
  );
  const asistenciaRouter = crearAsistenciaRouter(asistenciaController, autenticar);

  // Aquí se conectará hojas-de-vida.
  return {
    authRouter,
    asistenciaRouter,
    autenticar,
    traductoresDeErrores: [traducirErroresAuth, traducirErroresAsistencia],
  };
}