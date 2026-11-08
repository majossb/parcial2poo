// Caso de uso: crear usuario y asignar rol (RF-11)
import {
  DatosUsuarioInvalidosError,
  normalizarCorreo,
  validarCorreo,
  validarPassword,
} from '../../domain/usuario.js';
import type { Usuario } from '../../domain/usuario.js';
import { esRol } from '../../domain/rol.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { UsuarioRepository } from '../ports/usuario-repository.js';

export interface SolicitudCrearUsuario {
  correo: string;
  password: string;
  rol: string; // llega como texto desde afuera; aquí se valida
}

export class CrearUsuario {
  private readonly usuarios: UsuarioRepository;
  private readonly hasher: PasswordHasher;

  constructor(usuarios: UsuarioRepository, hasher: PasswordHasher) {
    this.usuarios = usuarios;
    this.hasher = hasher;
  }

  // Quién puede llamar a este caso de uso (solo el administrador) lo decide la ruta, no él.
  async ejecutar(solicitud: SolicitudCrearUsuario): Promise<Usuario> {
    const correo = normalizarCorreo(solicitud.correo);
    validarCorreo(correo);
    validarPassword(solicitud.password);
    if (!esRol(solicitud.rol)) {
      throw new DatosUsuarioInvalidosError('El rol no es válido');
    }

    const passwordHash = await this.hasher.hash(solicitud.password);
    // Si el correo ya existe, el repositorio lanza CorreoYaRegistradoError.
    return this.usuarios.crear({ correo, passwordHash, rol: solicitud.rol });
  }
}