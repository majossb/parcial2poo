// Única puerta de entrada al módulo auth. Los demás módulos y el composition-root
// solo importan desde aquí, nunca desde archivos internos.

// Dominio
export { ROLES, esRol, rolCubre } from './domain/rol.js';
export type { Rol } from './domain/rol.js';
export {
  CorreoYaRegistradoError,
  CredencialesInvalidasError,
  DatosUsuarioInvalidosError,
} from './domain/usuario.js';
export type { Usuario } from './domain/usuario.js';

// Casos de uso y puertos
export { IniciarSesion } from './application/use-cases/iniciar-sesion.js';
export { CerrarSesion } from './application/use-cases/cerrar-sesion.js';
export { CrearUsuario } from './application/use-cases/crear-usuario.js';
export type { PasswordHasher } from './application/ports/password-hasher.js';
export type { TokenService, PayloadToken } from './application/ports/token-service.js';
export type { UsuarioRepository } from './application/ports/usuario-repository.js';

// Adaptadores (los conecta el composition-root)
export { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher.js';
export { JwtTokenService } from './infrastructure/security/jwt-token-service.js';
export { PostgresUsuarioRepository } from './infrastructure/persistence/postgres-usuario-repository.js';
export { AuthController } from './infrastructure/http/auth.controller.js';
export { crearAuthRouter } from './infrastructure/http/auth.routes.js';
export { crearAutenticar, exigirRol } from './infrastructure/http/auth.middleware.js';