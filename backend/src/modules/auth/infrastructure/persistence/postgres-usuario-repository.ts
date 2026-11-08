/// Adaptador: usuarios en PostgreSQL. Todas las consultas son parametrizadas.
import type { Pool } from '../../../../shared/database/pool.js';
import type {
  DatosNuevoUsuario,
  UsuarioRepository,
} from '../../application/ports/usuario-repository.js';
import { esRol } from '../../domain/rol.js';
import { CorreoYaRegistradoError } from '../../domain/usuario.js';
import type { Usuario, UsuarioConCredenciales } from '../../domain/usuario.js';

const VIOLACION_UNICIDAD = '23505';

export class PostgresUsuarioRepository implements UsuarioRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async buscarPorCorreo(correo: string): Promise<UsuarioConCredenciales | null> {
    const { rows } = await this.pool.query(
      `SELECT u.id, u.correo, u.password_hash, u.activo, r.nombre AS rol
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
        WHERE lower(u.correo) = lower($1)`,
      [correo],
    );
    const fila = rows[0];
    if (!fila) return null;
    if (!esRol(fila.rol)) throw new Error(`Rol desconocido en la base de datos: ${fila.rol}`);
    return {
      id: fila.id,
      correo: fila.correo,
      rol: fila.rol,
      activo: fila.activo,
      passwordHash: fila.password_hash,
    };
  }

  async crear(datos: DatosNuevoUsuario): Promise<Usuario> {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO usuarios (correo, password_hash, rol_id)
         SELECT $1, $2, r.id FROM roles r WHERE r.nombre = $3
         RETURNING id, correo, activo`,
        [datos.correo, datos.passwordHash, datos.rol],
      );
      const fila = rows[0];
      if (!fila) throw new Error(`El rol "${datos.rol}" no existe en la tabla roles`);
      return { id: fila.id, correo: fila.correo, rol: datos.rol, activo: fila.activo };
    } catch (error) {
      // El índice único sobre lower(correo) es la defensa real contra duplicados,
      // incluso si dos peticiones llegan al mismo tiempo.
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === VIOLACION_UNICIDAD) {
        throw new CorreoYaRegistradoError();
      }
      throw error;
    }
  }
}