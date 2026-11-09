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
import {
  ActualizarOperario,
  AgregarExperiencia,
  CambiarEstadoOperario,
  ConsultarHojaDeVida,
  CuentasDesdeAuth,
  HojasDeVidaController,
  ListarOperarios,
  PostgresOperarioRepository,
  RegistrarOperario,
  crearHojasDeVidaRouter,
  traducirErroresHojasDeVida,
} from './modules/hojas-de-vida/index.js';

export interface Contenedor {
  readonly authRouter: Router;
  readonly asistenciaRouter: Router;
  readonly hojasDeVidaRouter: Router;
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
  // Se comparte: auth lo usa en sus rutas y hojas-de-vida para crear la cuenta del operario.
  const crearUsuario = new CrearUsuario(usuarios, hasher);
  const authController = new AuthController(
    new IniciarSesion(usuarios, hasher, tokens),
    new CerrarSesion(),
    crearUsuario,
  );
  const authRouter = crearAuthRouter(authController, autenticar);

  // --- hojas-de-vida ---
  const repositorioOperarios = new PostgresOperarioRepository(pool);
  const hojasDeVidaController = new HojasDeVidaController(
    new RegistrarOperario(repositorioOperarios, new CuentasDesdeAuth(crearUsuario)),
    new ActualizarOperario(repositorioOperarios),
    new CambiarEstadoOperario(repositorioOperarios),
    new ConsultarHojaDeVida(repositorioOperarios),
    new ListarOperarios(repositorioOperarios),
    new AgregarExperiencia(repositorioOperarios),
  );
  const hojasDeVidaRouter = crearHojasDeVidaRouter(hojasDeVidaController, autenticar);

  // --- asistencia ---
  // Los operarios ahora vienen del módulo hojas-de-vida (ya no del archivo temporal).
  const operarios = new OperariosDesdeHojasDeVida(repositorioOperarios);
  const marcaciones = new PostgresMarcacionRepository(pool);
  const registrar = new RegistrarMarcacion(marcaciones, operarios, new RelojDelSistema());
  const asistenciaController = new AsistenciaController(
    new SincronizarMarcaciones(registrar),
    new ConsultarHistorial(marcaciones),
    new ListarConjuntos(new PostgresConjuntoRepository(pool)),
    new ResolverOperarioDelUsuario(operarios),
  );
  const asistenciaRouter = crearAsistenciaRouter(asistenciaController, autenticar);

  return {
    authRouter,
    asistenciaRouter,
    hojasDeVidaRouter,
    autenticar,
    traductoresDeErrores: [traducirErroresAuth, traducirErroresAsistencia, traducirErroresHojasDeVida],
  };
}