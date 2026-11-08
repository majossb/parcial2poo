// Adaptador: conjuntos residenciales en PostgreSQL
import type { Pool } from '../../../../shared/database/pool.js';
import type { ConjuntoRepository } from '../../application/ports/conjunto-repository.js';
import type { Conjunto } from '../../domain/conjunto.js';

export class PostgresConjuntoRepository implements ConjuntoRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async listarActivos(): Promise<Conjunto[]> {
    const { rows } = await this.pool.query(
      `SELECT id, nombre, activo
         FROM conjuntos_residenciales
        WHERE activo
        ORDER BY nombre`,
    );
    return rows.map((f) => ({ id: f.id, nombre: f.nombre, activo: f.activo }));
  }
}
