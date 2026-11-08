// Punto de arranque del servidor
import { cargarEnv } from './config/env.js';
import { crearPool } from './shared/database/pool.js';
import { componer } from './composition-root.js';
import { crearApp } from './app.js';

const env = cargarEnv();
const pool = crearPool(env.DATABASE_URL);
const app = crearApp(env, componer(env, pool));

const servidor = app.listen(env.PORT, () => {
  console.log(`API escuchando en http://localhost:${env.PORT}`);
});

// Cierre ordenado: deja de aceptar peticiones y libera las conexiones.
function apagar(): void {
  servidor.close(() => {
    void pool.end().then(() => process.exit(0));
  });
}
process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);