// Lectura y validación de variables de entorno
import 'dotenv/config';
import { z } from 'zod';

const esquema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET debe tener al menos 8 caracteres'),
  JWT_EXPIRES_IN: z.string().default('1h'),
});

export type Env = z.infer<typeof esquema>;

// Es una función (y no una constante) para que importar este archivo no falle
// en pruebas que solo necesitan parte de la configuración.
export function cargarEnv(origen: NodeJS.ProcessEnv = process.env): Env {
  const resultado = esquema.safeParse(origen);
  if (!resultado.success) {
    const detalle = resultado.error.issues
      .map((i) => `- ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuración inválida en las variables de entorno:\n${detalle}`);
  }
  return resultado.data;
}