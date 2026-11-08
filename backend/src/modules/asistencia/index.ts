// Única puerta de entrada al módulo asistencia.

// Casos de uso y puertos
export { RegistrarMarcacion } from './application/use-cases/registrar-marcacion.js';
export { SincronizarMarcaciones } from './application/use-cases/sincronizar-marcaciones.js';
export { ConsultarHistorial } from './application/use-cases/consultar-historial.js';
export { ListarConjuntos } from './application/use-cases/listar-conjuntos.js';
export { ResolverOperarioDelUsuario } from './application/use-cases/resolver-operario-del-usuario.js';
export type { OperariosGateway, OperarioResumen } from './application/ports/operarios-gateway.js';

// Adaptadores (los conecta el composition-root)
export { PostgresMarcacionRepository } from './infrastructure/persistence/postgres-marcacion-repository.js';
export { PostgresConjuntoRepository } from './infrastructure/persistence/postgres-conjunto-repository.js';
export { RelojDelSistema } from './infrastructure/reloj-del-sistema.js';
export { OperariosDesdeHojasDeVida } from './infrastructure/integrations/operarios-desde-hojas-de-vida.js';
export type { BuscadorDeOperarios } from './infrastructure/integrations/operarios-desde-hojas-de-vida.js';
export { AsistenciaController } from './infrastructure/http/asistencia.controller.js';
export { crearAsistenciaRouter } from './infrastructure/http/asistencia.routes.js';
export { traducirErroresAsistencia } from './infrastructure/http/asistencia.errores.js';