// Adaptador de salida: repositorio de operarios en PostgreSQL
// Adaptador de salida: repositorio de operarios y hojas de vida en PostgreSQL
import type { Pool } from '../../../../shared/database/pool.js';
import { Operario } from '../../domain/operario.js';
import { ExperienciaLaboral, HojaDeVida } from '../../domain/hoja-de-vida.js';
import type {
  FiltroOperarios,
  OperarioRepository,
} from '../../application/ports/operario-repository.js';

interface FilaOperario {
  id: string;
  usuario_id: string;
  documento_identidad: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  direccion: string | null;
  cargo: string;
  fecha_ingreso: Date;
  activo: boolean;
}

interface FilaExperiencia {
  id: string;
  operario_id: string;
  empresa: string;
  cargo: string;
  fecha_inicio: Date;
  fecha_fin: Date | null;
  descripcion: string | null;
}

const COLUMNAS_OPERARIO = `id, usuario_id, documento_identidad, nombres, apellidos,
  telefono, direccion, cargo, fecha_ingreso, activo`;

function operarioADominio(f: FilaOperario): Operario {
  return Operario.reconstruir(
    f.id,
    f.usuario_id,
    {
      documentoIdentidad: f.documento_identidad,
      nombres: f.nombres,
      apellidos: f.apellidos,
      telefono: f.telefono,
      direccion: f.direccion,
      cargo: f.cargo,
      fechaIngreso: f.fecha_ingreso,
    },
    f.activo,
  );
}

function experienciaADominio(f: FilaExperiencia): ExperienciaLaboral {
  return ExperienciaLaboral.reconstruir(f.id, f.operario_id, {
    empresa: f.empresa,
    cargo: f.cargo,
    fechaInicio: f.fecha_inicio,
    fechaFin: f.fecha_fin,
    descripcion: f.descripcion,
  });
}

// Las columnas DATE se envían como 'AAAA-MM-DD' para que la zona horaria no cambie el día
function aFechaSql(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export class PostgresOperarioRepository implements OperarioRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Si el id no existe lo inserta; si ya existe, actualiza sus datos
  async guardar(o: Operario): Promise<void> {
    const d = o.datos;
    await this.pool.query(
      `INSERT INTO operarios
         (id, usuario_id, documento_identidad, nombres, apellidos,
          telefono, direccion, cargo, fecha_ingreso, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         documento_identidad = EXCLUDED.documento_identidad,
         nombres = EXCLUDED.nombres,
         apellidos = EXCLUDED.apellidos,
         telefono = EXCLUDED.telefono,
         direccion = EXCLUDED.direccion,
         cargo = EXCLUDED.cargo,
         fecha_ingreso = EXCLUDED.fecha_ingreso,
         activo = EXCLUDED.activo,
         actualizado_en = now()`,
      [
        o.id,
        o.usuarioId,
        d.documentoIdentidad,
        d.nombres,
        d.apellidos,
        d.telefono,
        d.direccion,
        d.cargo,
        aFechaSql(d.fechaIngreso),
        o.activo,
      ],
    );
  }

  async buscarPorId(id: string): Promise<Operario | null> {
    const r = await this.pool.query<FilaOperario>(
      `SELECT ${COLUMNAS_OPERARIO} FROM operarios WHERE id = $1`,
      [id],
    );
    return r.rows[0] ? operarioADominio(r.rows[0]) : null;
  }

  async buscarPorDocumento(documentoIdentidad: string): Promise<Operario | null> {
    const r = await this.pool.query<FilaOperario>(
      `SELECT ${COLUMNAS_OPERARIO} FROM operarios WHERE documento_identidad = $1`,
      [documentoIdentidad],
    );
    return r.rows[0] ? operarioADominio(r.rows[0]) : null;
  }

  async buscarPorUsuarioId(usuarioId: string): Promise<Operario | null> {
    const r = await this.pool.query<FilaOperario>(
      `SELECT ${COLUMNAS_OPERARIO} FROM operarios WHERE usuario_id = $1`,
      [usuarioId],
    );
    return r.rows[0] ? operarioADominio(r.rows[0]) : null;
  }

  async listar(filtro: FiltroOperarios = {}): Promise<Operario[]> {
    const condicion = filtro.soloActivos ? 'WHERE activo = TRUE' : '';
    const r = await this.pool.query<FilaOperario>(
      `SELECT ${COLUMNAS_OPERARIO} FROM operarios ${condicion}
        ORDER BY apellidos ASC, nombres ASC`,
    );
    return r.rows.map(operarioADominio);
  }

  async buscarHojaDeVida(operarioId: string): Promise<HojaDeVida | null> {
    const operario = await this.buscarPorId(operarioId);
    if (!operario) {
      return null;
    }
    const r = await this.pool.query<FilaExperiencia>(
      `SELECT id, operario_id, empresa, cargo, fecha_inicio, fecha_fin, descripcion
         FROM experiencias_laborales
        WHERE operario_id = $1
        ORDER BY fecha_inicio DESC`,
      [operarioId],
    );
    return new HojaDeVida(operario, r.rows.map(experienciaADominio));
  }

  async guardarExperiencia(e: ExperienciaLaboral): Promise<void> {
    const d = e.datos;
    await this.pool.query(
      `INSERT INTO experiencias_laborales
         (id, operario_id, empresa, cargo, fecha_inicio, fecha_fin, descripcion)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        e.id,
        e.operarioId,
        d.empresa,
        d.cargo,
        aFechaSql(d.fechaInicio),
        d.fechaFin ? aFechaSql(d.fechaFin) : null,
        d.descripcion,
      ],
    );
  }
}