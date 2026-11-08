// Prueba de extremo a extremo de la capa HTTP de asistencia (Express + JWT + PostgreSQL reales).
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

const URL =
  process.env.DATABASE_URL ?? 'postgresql://mantenimiento:mantenimiento@localhost:55432/mantenimiento';
const pool = crearPool(URL);
let motivo = '';
const disponible = await pool
  .query(
    `SELECT (SELECT count(*) FROM roles)::int AS roles,
            (SELECT count(*) FROM conjuntos_residenciales)::int AS conjuntos`,
  )
  .then((r) => {
    if (r.rows[0].roles < 4 || r.rows[0].conjuntos < 1) {
      motivo = 'faltan datos: aplica los seeds (aplicar.ps1 -Seeds)';
    }
    return r.rows[0].roles >= 4 && r.rows[0].conjuntos >= 1;
  })
  .catch((e: unknown) => {
    motivo = `no hay conexión a PostgreSQL (${e instanceof Error ? e.message : String(e)})`;
    return false;
  });
if (!disponible) console.warn(`Pruebas HTTP de asistencia SALTADAS: ${motivo}`);

const sufijo = randomUUID().slice(0, 8);
const PASSWORD = 'Clave-segura-1';
const correo = (nombre: string) => `${nombre}.${sufijo}@test.local`;

describe.skipIf(!disponible)('asistencia por HTTP contra PostgreSQL real', () => {
  let servidor: Server;
  let base = '';
  let conjuntoId = '';
  let operarioId = '';
  let otroOperarioId = '';
  let tokenAdmin = '';
  let tokenOperario = '';
  let tokenSinHoja = '';
  let tokenSupervisor = '';

  const llamar = (metodo: string, ruta: string, token?: string, cuerpo?: unknown) =>
    fetch(`${base}/api/asistencia${ruta}`, {
      method: metodo,
      headers: {
        ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });

  const login = async (c: string): Promise<string> => {
    const r = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: c, password: PASSWORD }),
    });
    return ((await r.json()) as { token: string }).token;
  };

  const crearUsuario = async (nombre: string, rol: string): Promise<string> => {
    const r = await fetch(`${base}/api/auth/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ correo: correo(nombre), password: PASSWORD, rol }),
    });
    return ((await r.json()) as { id: string }).id;
  };

  // Inserta la hoja de vida mínima de un operario (lo hará el módulo hojas-de-vida).
  const crearOperario = async (usuarioId: string, documento: string): Promise<string> => {
    const r = await pool.query(
      `INSERT INTO operarios (usuario_id, documento_identidad, nombres, apellidos, cargo, fecha_ingreso)
       VALUES ($1, $2, 'Prueba', 'Http', 'Operario', '2026-01-01') RETURNING id`,
      [usuarioId, documento],
    );
    return r.rows[0].id;
  };

  const marca = (tipo: 'entrada' | 'salida', iso: string, id = randomUUID()) => ({
    id,
    conjuntoId,
    tipo,
    registradaEnDispositivo: iso,
  });

  beforeAll(async () => {
    const env = cargarEnv({ ...process.env, DATABASE_URL: URL, JWT_SECRET: 'secreto-de-pruebas' });
    servidor = crearApp(env, componer(env, pool)).listen(0);
    base = `http://localhost:${(servidor.address() as AddressInfo).port}`;

    conjuntoId = (await pool.query('SELECT id FROM conjuntos_residenciales LIMIT 1')).rows[0].id;
    const admin = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'admin@empresa.local', password: 'Admin123!' }),
    });
    tokenAdmin = ((await admin.json()) as { token: string }).token;

    const doc = `H${Date.now()}`;
    operarioId = await crearOperario(await crearUsuario('operario', 'operario'), `${doc}a`.slice(0, 20));
    otroOperarioId = await crearOperario(await crearUsuario('otro', 'operario'), `${doc}b`.slice(0, 20));
    await crearUsuario('sinhoja', 'operario');
    await crearUsuario('supervisor', 'supervisor');

    tokenOperario = await login(correo('operario'));
    tokenSinHoja = await login(correo('sinhoja'));
    tokenSupervisor = await login(correo('supervisor'));
  });

  afterAll(async () => {
    await pool.query('DELETE FROM marcaciones WHERE operario_id = ANY($1)', [[operarioId, otroOperarioId]]);
    await pool.query('DELETE FROM operarios WHERE id = ANY($1)', [[operarioId, otroOperarioId]]);
    await pool.query('DELETE FROM usuarios WHERE lower(correo) LIKE $1', [`%${sufijo}%`]);
    servidor?.close();
  });

  it('sincronizar exige sesión (401) y rol operario (403)', async () => {
    const cuerpo = { marcaciones: [marca('entrada', '2026-10-09T08:00:00Z')] };
    expect((await llamar('POST', '/marcaciones/sincronizar', undefined, cuerpo)).status).toBe(401);
    expect((await llamar('POST', '/marcaciones/sincronizar', tokenAdmin, cuerpo)).status).toBe(403);
    expect((await llamar('POST', '/marcaciones/sincronizar', tokenSupervisor, cuerpo)).status).toBe(403);
  });

  it('un operario sin hoja de vida no puede sincronizar (403)', async () => {
    const r = await llamar('POST', '/marcaciones/sincronizar', tokenSinHoja, {
      marcaciones: [marca('entrada', '2026-10-09T08:00:00Z')],
    });
    expect(r.status).toBe(403);
  });

  it('sincroniza un lote desordenado, queda ordenado por hora y reenviarlo no duplica (RF-08)', async () => {
    const entrada = marca('entrada', '2026-10-09T08:00:00Z');
    const salida = marca('salida', '2026-10-09T17:00:00Z');
    const lote = { marcaciones: [salida, entrada] }; // llegan al revés

    const primera = await llamar('POST', '/marcaciones/sincronizar', tokenOperario, lote);
    expect(primera.status).toBe(200);
    const { resultados } = (await primera.json()) as { resultados: { id: string; resultado: string; estadoRevision?: string }[] };
    expect(resultados.map((x) => x.id)).toEqual([entrada.id, salida.id]);
    expect(resultados.map((x) => x.resultado)).toEqual(['creada', 'creada']);
    expect(resultados.every((x) => x.estadoRevision === 'normal')).toBe(true);

    const segunda = await llamar('POST', '/marcaciones/sincronizar', tokenOperario, lote);
    const repetido = (await segunda.json()) as { resultados: { resultado: string }[] };
    expect(repetido.resultados.map((x) => x.resultado)).toEqual(['duplicada', 'duplicada']);

    const n = await pool.query('SELECT count(*)::int AS n FROM marcaciones WHERE operario_id = $1', [operarioId]);
    expect(n.rows[0].n).toBe(2);
  });

  it('el operario sale del token: un operarioId enviado en el cuerpo se ignora', async () => {
    const item = { ...marca('entrada', '2026-10-08T08:00:00Z'), operarioId: otroOperarioId };
    const r = await llamar('POST', '/marcaciones/sincronizar', tokenOperario, { marcaciones: [item] });
    expect(r.status).toBe(200);
    const fila = await pool.query('SELECT operario_id FROM marcaciones WHERE id = $1', [item.id]);
    expect(fila.rows[0].operario_id).toBe(operarioId);
  });

  it('una marcación fuera de secuencia se guarda "a_revisar" y una mal formada se rechaza sola', async () => {
    const lote = {
      marcaciones: [
        marca('salida', '2026-10-07T09:00:00Z'), // salida sin entrada abierta
        { ...marca('entrada', '2026-10-07T10:00:00Z'), id: 'no-es-un-uuid' }, // mal formada
      ],
    };
    const r = await llamar('POST', '/marcaciones/sincronizar', tokenOperario, lote);
    expect(r.status).toBe(200);
    const { resultados } = (await r.json()) as { resultados: { resultado: string; estadoRevision?: string; motivo?: string }[] };
    expect(resultados[0]).toMatchObject({ resultado: 'creada', estadoRevision: 'a_revisar' });
    expect(resultados[1]).toMatchObject({ resultado: 'rechazada' });
  });

  it('valida la forma del lote: vacío, sin campos o demasiado grande dan 400', async () => {
    expect((await llamar('POST', '/marcaciones/sincronizar', tokenOperario, { marcaciones: [] })).status).toBe(400);
    expect((await llamar('POST', '/marcaciones/sincronizar', tokenOperario, { marcaciones: [{ id: 'x' }] })).status).toBe(400);
    const grande = Array.from({ length: 501 }, () => marca('entrada', '2026-10-09T08:00:00Z'));
    expect((await llamar('POST', '/marcaciones/sincronizar', tokenOperario, { marcaciones: grande })).status).toBe(400);
  });

  const PERIODO = 'desde=2026-10-01T00:00:00Z&hasta=2026-10-31T23:59:59Z';

  it('historial: lo ven el administrador y el supervisor, con marcaciones y jornadas', async () => {
    for (const token of [tokenAdmin, tokenSupervisor]) {
      const r = await llamar('GET', `/marcaciones?${PERIODO}&operarioId=${operarioId}`, token);
      expect(r.status).toBe(200);
      const cuerpo = (await r.json()) as { marcaciones: { operarioId: string }[]; jornadas: { duracionMinutos: number | null }[] };
      expect(cuerpo.marcaciones.length).toBeGreaterThanOrEqual(2);
      expect(cuerpo.marcaciones.every((m) => m.operarioId === operarioId)).toBe(true);
      expect(cuerpo.jornadas.some((j) => j.duracionMinutos === 540)).toBe(true); // 08:00 a 17:00
    }
  });

  it('historial: filtro "solo a revisar"', async () => {
    const r = await llamar('GET', `/marcaciones?${PERIODO}&operarioId=${operarioId}&soloARevisar=true`, tokenAdmin);
    const cuerpo = (await r.json()) as { marcaciones: { estadoRevision: string }[] };
    expect(cuerpo.marcaciones.length).toBeGreaterThanOrEqual(1);
    expect(cuerpo.marcaciones.every((m) => m.estadoRevision === 'a_revisar')).toBe(true);
  });

  it('historial: el operario no puede consultarlo (403) y sin sesión da 401', async () => {
    expect((await llamar('GET', `/marcaciones?${PERIODO}`, tokenOperario)).status).toBe(403);
    expect((await llamar('GET', `/marcaciones?${PERIODO}`)).status).toBe(401);
  });

  it('historial: valida las fechas y el rango (400)', async () => {
    expect((await llamar('GET', '/marcaciones', tokenAdmin)).status).toBe(400);
    expect((await llamar('GET', '/marcaciones?desde=hoy&hasta=mañana', tokenAdmin)).status).toBe(400);
    expect((await llamar('GET', '/marcaciones?desde=2026-10-31T00:00:00Z&hasta=2026-10-01T00:00:00Z', tokenAdmin)).status).toBe(400);
    expect((await llamar('GET', '/marcaciones?desde=2026-01-01T00:00:00Z&hasta=2026-10-01T00:00:00Z', tokenAdmin)).status).toBe(400);
    expect((await llamar('GET', `/marcaciones?${PERIODO}&operarioId=no-es-uuid`, tokenAdmin)).status).toBe(400);
  });

  it('"mias": el operario ve solo lo suyo aunque pida el operarioId de otro', async () => {
    const r = await llamar('GET', `/marcaciones/mias?${PERIODO}&operarioId=${otroOperarioId}`, tokenOperario);
    expect(r.status).toBe(200);
    const cuerpo = (await r.json()) as { marcaciones: { operarioId: string }[] };
    expect(cuerpo.marcaciones.length).toBeGreaterThanOrEqual(2);
    expect(cuerpo.marcaciones.every((m) => m.operarioId === operarioId)).toBe(true);
    expect((await llamar('GET', `/marcaciones/mias?${PERIODO}`, tokenSupervisor)).status).toBe(403);
  });

  it('conjuntos: cualquier usuario con sesión los ve, sin sesión no', async () => {
    expect((await llamar('GET', '/conjuntos')).status).toBe(401);
    const r = await llamar('GET', '/conjuntos', tokenOperario);
    expect(r.status).toBe(200);
    const { conjuntos } = (await r.json()) as { conjuntos: { id: string; nombre: string }[] };
    expect(conjuntos.length).toBeGreaterThanOrEqual(1);
    expect(conjuntos.some((c) => c.id === conjuntoId)).toBe(true);
  });
});
