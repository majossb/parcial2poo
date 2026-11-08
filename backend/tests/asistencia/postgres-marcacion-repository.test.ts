import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearPool } from '../../src/shared/database/pool.js';
import { PostgresMarcacionRepository } from '../../src/modules/asistencia/infrastructure/persistence/postgres-marcacion-repository.js';
import type { Marcacion } from '../../src/modules/asistencia/domain/marcacion.js';

const URL =
  process.env.DATABASE_URL ?? 'postgresql://mantenimiento:mantenimiento@localhost:55432/mantenimiento';
const pool = crearPool(URL);
const disponible = await pool.query('SELECT 1').then(
  () => true,
  () => false,
);

afterAll(async () => {
  await pool.end();
});

describe.skipIf(!disponible)('PostgresMarcacionRepository (base de datos real)', () => {
  const repo = new PostgresMarcacionRepository(pool);
  const usuarioId = randomUUID();
  const operarioId = randomUUID();
  let conjuntoId = '';

  const marca = (tipo: 'entrada' | 'salida', iso: string, id = randomUUID()): Marcacion => ({
    id,
    operarioId,
    conjuntoId,
    tipo,
    registradaEnDispositivo: new Date(iso),
    recibidaEnServidor: new Date('2026-11-10T12:00:00Z'),
    estadoRevision: 'normal',
  });

  beforeAll(async () => {
    const c = await pool.query('SELECT id FROM conjuntos_residenciales LIMIT 1');
    if (!c.rows[0]) throw new Error('No hay conjuntos: aplica los seeds (aplicar.ps1 -Seeds)');
    conjuntoId = c.rows[0].id;

    await pool.query(
      `INSERT INTO usuarios (id, correo, password_hash, rol_id)
       VALUES ($1, $2, 'hash-de-prueba', 4)`,
      [usuarioId, `prueba-${usuarioId}@test.local`],
    );
    await pool.query(
      `INSERT INTO operarios (id, usuario_id, documento_identidad, nombres, apellidos, cargo, fecha_ingreso)
       VALUES ($1, $2, $3, 'Prueba', 'Integracion', 'Operario', '2026-01-01')`,
      [operarioId, usuarioId, `T${Date.now()}`.slice(0, 20)],
    );
  });

  afterAll(async () => {
    if (!disponible) return;
    await pool.query('DELETE FROM marcaciones WHERE operario_id = $1', [operarioId]);
    await pool.query('DELETE FROM operarios WHERE id = $1', [operarioId]);
    await pool.query('DELETE FROM usuarios WHERE id = $1', [usuarioId]);
  });

  it('guarda una marcación nueva', async () => {
    const m = marca('entrada', '2026-11-09T08:00:00Z');
    expect(await repo.guardar(m)).toBe(true);
  });

  it('el mismo UUID enviado dos veces queda una sola vez (RF-08)', async () => {
    const m = marca('entrada', '2026-11-09T09:00:00Z');
    expect(await repo.guardar(m)).toBe(true);
    expect(await repo.guardar(m)).toBe(false);

    const r = await pool.query('SELECT count(*)::int AS n FROM marcaciones WHERE id = $1', [m.id]);
    expect(r.rows[0].n).toBe(1);
  });

  it('buscarUltimaAntesDe devuelve la anterior y es estricta con el instante', async () => {
    const entrada = marca('entrada', '2026-11-08T08:00:00Z');
    const salida = marca('salida', '2026-11-08T16:00:00Z');
    await repo.guardar(entrada);
    await repo.guardar(salida);

    const despues = await repo.buscarUltimaAntesDe(operarioId, new Date('2026-11-08T17:00:00Z'));
    expect(despues?.id).toBe(salida.id);

    const justoEnLaSalida = await repo.buscarUltimaAntesDe(operarioId, new Date('2026-11-08T16:00:00Z'));
    expect(justoEnLaSalida?.id).toBe(entrada.id);
  });

  it('listar filtra por rango y por a_revisar, y ordena de antigua a reciente', async () => {
    const revisar: Marcacion = { ...marca('salida', '2026-11-07T10:00:00Z'), estadoRevision: 'a_revisar' };
    const normal = marca('entrada', '2026-11-07T08:00:00Z');
    await repo.guardar(revisar);
    await repo.guardar(normal);

    const dia = { operarioId, desde: new Date('2026-11-07T00:00:00Z'), hasta: new Date('2026-11-07T23:59:59Z') };
    const todas = await repo.listar(dia);
    expect(todas.map((x) => x.id)).toEqual([normal.id, revisar.id]);

    const soloRevisar = await repo.listar({ ...dia, soloARevisar: true });
    expect(soloRevisar.map((x) => x.id)).toEqual([revisar.id]);
  });

  it('devuelve las fechas como Date y el tipo correcto', async () => {
    const m = marca('entrada', '2026-11-06T08:00:00Z');
    await repo.guardar(m);
    const [leida] = await repo.listar({
      operarioId,
      desde: new Date('2026-11-06T00:00:00Z'),
      hasta: new Date('2026-11-06T23:59:59Z'),
    });
    expect(leida.registradaEnDispositivo).toBeInstanceOf(Date);
    expect(leida.registradaEnDispositivo.toISOString()).toBe('2026-11-06T08:00:00.000Z');
    expect(leida.tipo).toBe('entrada');
  });
});