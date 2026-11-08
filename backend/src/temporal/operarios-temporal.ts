// TEMPORAL: reemplaza al módulo hojas-de-vida mientras no esté terminado.
//
// Rompe a propósito la regla "cada módulo es dueño de sus tablas" (lee `operarios` desde
// fuera). BORRAR este archivo cuando hojas-de-vida exporte su propio buscador de operarios
// y cambiar la línea marcada en composition-root.ts.
import type { Pool } from '../shared/database/pool.js';
import type { BuscadorDeOperarios } from '../modules/asistencia/index.js';

export class OperariosTemporalPostgres implements BuscadorDeOperarios {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async buscarPorId(operarioId: string): Promise<{ id: string; activo: boolean } | null> {
    const { rows } = await this.pool.query('SELECT id, activo FROM operarios WHERE id = $1', [operarioId]);
    return rows[0] ? { id: rows[0].id, activo: rows[0].activo } : null;
  }

  async buscarPorUsuarioId(usuarioId: string): Promise<{ id: string; activo: boolean } | null> {
    const { rows } = await this.pool.query('SELECT id, activo FROM operarios WHERE usuario_id = $1', [
      usuarioId,
    ]);
    return rows[0] ? { id: rows[0].id, activo: rows[0].activo } : null;
  }
}
