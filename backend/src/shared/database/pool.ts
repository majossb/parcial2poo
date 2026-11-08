
// Conexión compartida a PostgreSQL
import pg from 'pg';

export type Pool = pg.Pool;

export function crearPool(databaseUrl: string): Pool {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 10, // suficiente para ~200 usuarios; se ajusta tras las pruebas de carga
  });
  // Sin este manejador, un error en una conexión inactiva tumbaría todo el proceso.
  pool.on('error', (error) => {
    console.error('Error inesperado en una conexión inactiva de PostgreSQL:', error);
  });
  return pool;
}