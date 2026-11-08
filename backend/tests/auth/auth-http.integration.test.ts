// Prueba de extremo a extremo: Express + JWT + bcrypt + PostgreSQL reales.
// Se salta (no falla) si no hay base de datos; el motivo se imprime con console.warn.
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app.js';
import { componer } from '../../src/composition-root.js';
import { cargarEnv } from '../../src/config/env.js';
import { crearPool } from '../../src/shared/database/pool.js';
import { PostgresUsuarioRepository } from '../../src/modules/auth/index.js';

const URL =
  process.env.DATABASE_URL ?? 'postgresql://mantenimiento:mantenimiento@localhost:55432/mantenimiento';
const pool = crearPool(URL);
let motivo = '';
const disponible = await pool
  .query('SELECT count(*)::int AS n FROM roles')
  .then((r) => {
    if (r.rows[0].n < 4) motivo = 'faltan los roles: aplica los seeds (aplicar.ps1 -Seeds)';
    return r.rows[0].n >= 4;
  })
  .catch((e: unknown) => {
    motivo = `no hay conexión a PostgreSQL (${e instanceof Error ? e.message : String(e)})`;
    return false;
  });
if (!disponible) console.warn(`Pruebas de auth contra la base SALTADAS: ${motivo}`);

const sufijo = randomUUID().slice(0, 8);
const correoNuevo = `Prueba.${sufijo}@Test.Local`;

describe.skipIf(!disponible)('auth contra PostgreSQL real', () => {
  let servidor: Server;
  let base = '';
  const repo = new PostgresUsuarioRepository(pool);

  const post = (ruta: string, cuerpo: unknown, token?: string) =>
    fetch(`${base}/api/auth${ruta}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(cuerpo),
    });

  const loginAdmin = async (): Promise<string> => {
    const r = await post('/login', { correo: 'admin@empresa.local', password: 'Admin123!' });
    return ((await r.json()) as { token: string }).token;
  };

  beforeAll(async () => {
    const env = cargarEnv({ ...process.env, DATABASE_URL: URL, JWT_SECRET: 'secreto-de-pruebas' });
    servidor = crearApp(env, componer(env, pool)).listen(0);
    base = `http://localhost:${(servidor.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM usuarios WHERE lower(correo) LIKE $1', [`%${sufijo}%`]);
    servidor?.close();
  });

  it('repositorio: busca sin distinguir mayúsculas e incluye el rol', async () => {
    const u = await repo.buscarPorCorreo('ADMIN@empresa.LOCAL');
    expect(u?.rol).toBe('administrador');
    expect(u?.activo).toBe(true);
    expect(await repo.buscarPorCorreo('nadie@empresa.local')).toBeNull();
  });

  it('el administrador inicia sesión y recibe token y usuario sin hash', async () => {
    const r = await post('/login', { correo: 'ADMIN@empresa.local ', password: 'Admin123!' });
    expect(r.status).toBe(200);
    const cuerpo = (await r.json()) as { token: string; usuario: Record<string, unknown> };
    expect(cuerpo.token.split('.')).toHaveLength(3);
    expect(cuerpo.usuario.rol).toBe('administrador');
    expect(JSON.stringify(cuerpo)).not.toContain('password');
  });

  it('contraseña incorrecta y correo inexistente dan el mismo 401', async () => {
    const mala = await post('/login', { correo: 'admin@empresa.local', password: 'incorrecta1' });
    const inexistente = await post('/login', { correo: 'nadie@empresa.local', password: 'incorrecta1' });
    expect(mala.status).toBe(401);
    expect(inexistente.status).toBe(401);
    expect(await mala.json()).toEqual(await inexistente.json());
  });

  it('login sin datos responde 400', async () => {
    expect((await post('/login', {})).status).toBe(400);
  });

  it('crear usuario exige token (401) y rol administrador (403)', async () => {
    const solicitud = { correo: correoNuevo, password: 'Clave-segura-1', rol: 'operario' };
    expect((await post('/usuarios', solicitud)).status).toBe(401);

    // Un token válido pero de un operario
    const admin = await loginAdmin();
    const creado = await post('/usuarios', solicitud, admin);
    expect(creado.status).toBe(201);
    const operario = await post('/login', { correo: correoNuevo, password: 'Clave-segura-1' });
    const { token } = (await operario.json()) as { token: string };
    const prohibido = await post('/usuarios', { ...solicitud, correo: `otro.${sufijo}@test.local` }, token);
    expect(prohibido.status).toBe(403);
  });

  it('crea el usuario normalizado, rechaza el duplicado (409) y deja iniciar sesión', async () => {
    const admin = await loginAdmin();
    const repetido = await post('/usuarios', { correo: correoNuevo.toUpperCase(), password: 'Clave-segura-1', rol: 'operario' }, admin);
    expect(repetido.status).toBe(409);

    const guardado = await repo.buscarPorCorreo(correoNuevo);
    expect(guardado?.correo).toBe(correoNuevo.toLowerCase());
    expect(guardado?.rol).toBe('operario');
  });

  it('rechaza rol inválido y contraseña corta con 400', async () => {
    const admin = await loginAdmin();
    const rolMalo = await post('/usuarios', { correo: `x.${sufijo}@test.local`, password: 'Clave-segura-1', rol: 'rey' }, admin);
    const corta = await post('/usuarios', { correo: `y.${sufijo}@test.local`, password: '123', rol: 'operario' }, admin);
    expect(rolMalo.status).toBe(400);
    expect(corta.status).toBe(400);
  });

  it('un usuario desactivado no puede iniciar sesión', async () => {
    await pool.query('UPDATE usuarios SET activo = false WHERE lower(correo) = lower($1)', [correoNuevo]);
    const r = await post('/login', { correo: correoNuevo, password: 'Clave-segura-1' });
    expect(r.status).toBe(401);
  });

  it('logout exige token y responde 204', async () => {
    expect((await post('/logout', {})).status).toBe(401);
    expect((await post('/logout', {}, await loginAdmin())).status).toBe(204);
  });

  it('una ruta inexistente responde 404 en JSON', async () => {
    const r = await fetch(`${base}/api/nada`);
    expect(r.status).toBe(404);
    expect(await r.json()).toEqual({ error: 'Ruta no encontrada' });
  });
});