import { randomUUID } from 'node:crypto';
import type { PasswordHasher } from '../../src/modules/auth/application/ports/password-hasher.js';
import type {
  PayloadToken,
  TokenService,
} from '../../src/modules/auth/application/ports/token-service.js';
import type {
  DatosNuevoUsuario,
  UsuarioRepository,
} from '../../src/modules/auth/application/ports/usuario-repository.js';
import { esRol } from '../../src/modules/auth/domain/rol.js';
import { CorreoYaRegistradoError } from '../../src/modules/auth/domain/usuario.js';
import type { Usuario, UsuarioConCredenciales } from '../../src/modules/auth/domain/usuario.js';

// Hash "de mentira": rápido y predecible. Cuenta cuántas veces se verificó una contraseña.
export class HasherFalso implements PasswordHasher {
  verificaciones = 0;

  async hash(password: string): Promise<string> {
    return `hash(${password})`;
  }

  async verificar(password: string, hash: string): Promise<boolean> {
    this.verificaciones++;
    return hash === `hash(${password})`;
  }
}

export class TokensFalsos implements TokenService {
  emitir(payload: PayloadToken): string {
    return `${payload.usuarioId}|${payload.rol}`;
  }

  verificar(token: string): PayloadToken | null {
    const [usuarioId, rol, ...resto] = token.split('|');
    if (!usuarioId || resto.length > 0 || !esRol(rol)) return null;
    return { usuarioId, rol };
  }
}

export class UsuariosEnMemoria implements UsuarioRepository {
  readonly guardados: UsuarioConCredenciales[] = [];

  async buscarPorCorreo(correo: string): Promise<UsuarioConCredenciales | null> {
    return this.guardados.find((u) => u.correo.toLowerCase() === correo.toLowerCase()) ?? null;
  }

  async crear(datos: DatosNuevoUsuario): Promise<Usuario> {
    if (await this.buscarPorCorreo(datos.correo)) throw new CorreoYaRegistradoError();
    const nuevo: UsuarioConCredenciales = {
      id: randomUUID(),
      correo: datos.correo,
      rol: datos.rol,
      activo: true,
      passwordHash: datos.passwordHash,
    };
    this.guardados.push(nuevo);
    return { id: nuevo.id, correo: nuevo.correo, rol: nuevo.rol, activo: nuevo.activo };
  }
}