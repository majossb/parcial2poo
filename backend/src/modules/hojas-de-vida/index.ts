// Única puerta de entrada al módulo hojas-de-vida.

// Casos de uso y puertos
export { RegistrarOperario } from './application/use-cases/registrar-operario.js';
export { ActualizarOperario } from './application/use-cases/actualizar-operario.js';
export { CambiarEstadoOperario } from './application/use-cases/cambiar-estado-operario.js';
export { ConsultarHojaDeVida } from './application/use-cases/consultar-hoja-de-vida.js';
export { ListarOperarios } from './application/use-cases/listar-operarios.js';
export { AgregarExperiencia } from './application/use-cases/agregar-experiencia.js';
export type { OperarioRepository } from './application/ports/operario-repository.js';
export type { CuentasUsuario } from './application/ports/cuentas-usuario.js';

// Adaptadores (los conecta el composition-root)
export { PostgresOperarioRepository } from './infrastructure/persistence/postgres-operario-repository.js';
export { CuentasDesdeAuth } from './infrastructure/integrations/cuentas-desde-auth.js';
export type { CreadorDeUsuarios } from './infrastructure/integrations/cuentas-desde-auth.js';
export { HojasDeVidaController } from './infrastructure/http/hojas-de-vida.controller.js';
export { crearHojasDeVidaRouter } from './infrastructure/http/hojas-de-vida.routes.js';
export { traducirErroresHojasDeVida } from './infrastructure/http/hojas-de-vida.errores.js';