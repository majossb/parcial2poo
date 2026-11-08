// Adaptador de salida: repositorio de marcaciones en PostgreSQL
import type { Pool } from '../../../../shared/database/pool.js';
import type { EstadoRevision, Marcacion, TipoMarcacion } from '../../domain/marcacion.js';
import type {
  FiltroMarcaciones,
  MarcacionRepository,
} from '../../application/ports/marcacion-repository.js';

interface FilaMarcacion {
  id: string;
  operario_id: string;
  conjunto_id: string;
  tipo: string;
  registrada_en_dispositivo: Date;
  recibida_en_servidor: Date;
  estado_revision: string;
}

const COLUMNAS = `id, operario_id, conjunto_id, tipo,
  registrada_en_dispositivo, recibida_en_servidor, estado_revision`;

function aDominio(f: FilaMarcacion): Marcacion {
  return {
    id: f.id,
    operarioId: f.operario_id,
    conjuntoId: f.conjunto_id,
    tipo: f.tipo as TipoMarcacion, // la base ya lo garantiza con un CHECK
    registradaEnDispositivo: f.registrada_en_dispositivo,
    recibidaEnServidor: f.recibida_en_servidor,
    estadoRevision: f.estado_revision as EstadoRevision,
  };
}

export class PostgresMarcacionRepository implements MarcacionRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // RF-08: la llave primaria es el UUID del celular. Si ya existe, no inserta
  // nada (rowCount = 0) y devolvemos false; así reenviar un lote no duplica.
  async guardar(m: Marcacion): Promise<boolean> {
    const r = await this.pool.query(
      `INSERT INTO marcaciones
         (id, operario_id, conjunto_id, tipo,
          registrada_en_dispositivo, recibida_en_servidor, estado_revision)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        m.id,
        m.operarioId,
        m.conjuntoId,
        m.tipo,
        m.registradaEnDispositivo,
        m.recibidaEnServidor,
        m.estadoRevision,
      ],
    );
    return r.rowCount === 1;
  }

  async buscarUltimaAntesDe(operarioId: string, instante: Date): Promise<Marcacion | null> {
    const r = await this.pool.query<FilaMarcacion>(
      `SELECT ${COLUMNAS}
         FROM marcaciones
        WHERE operario_id = $1 AND registrada_en_dispositivo < $2
        ORDER BY registrada_en_dispositivo DESC, recibida_en_servidor DESC
        LIMIT 1`,
      [operarioId, instante],
    );
    return r.rows[0] ? aDominio(r.rows[0]) : null;
  }

  async listar(f: FiltroMarcaciones): Promise<Marcacion[]> {
    const condiciones = [
      'registrada_en_dispositivo >= $1',
      'registrada_en_dispositivo <= $2',
    ];
    const valores: unknown[] = [f.desde, f.hasta];

    // Los valores siempre van como parámetros ($n), nunca pegados al texto SQL.
    if (f.operarioId) {
      valores.push(f.operarioId);
      condiciones.push(`operario_id = $${valores.length}`);
    }
    if (f.conjuntoId) {
      valores.push(f.conjuntoId);
      condiciones.push(`conjunto_id = $${valores.length}`);
    }
    if (f.soloARevisar) {
      condiciones.push(`estado_revision = 'a_revisar'`);
    }

    const r = await this.pool.query<FilaMarcacion>(
      `SELECT ${COLUMNAS}
         FROM marcaciones
        WHERE ${condiciones.join(' AND ')}
        ORDER BY registrada_en_dispositivo ASC, recibida_en_servidor ASC`,
      valores,
    );
    return r.rows.map(aDominio);
  }
}