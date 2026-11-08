// Caso de uso: iniciar sesión (RF-01)
import { CredencialesInvalidasError, normalizarCorreo } from '../../domain/usuario.js';
import type { Usuario } from '../../domain/usuario.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { TokenService } from '../ports/token-service.js';
import type { UsuarioRepository } from '../ports/usuario-repository.js';

export interface SolicitudInicioSesion {
  correo: string;
  password: string;
}

export interface ResultadoInicioSesion {
  token: string;
  usuario: Usuario;
}

export class IniciarSesion {
  private readonly usuarios: UsuarioRepository;
  private readonly hasher: PasswordHasher;
  private readonly tokens: TokenService;
  private hashDeRelleno: Promise<string> | null = null;

  constructor(usuarios: UsuarioRepository, hasher: PasswordHasher, tokens: TokenService) {
    this.usuarios = usuarios;
    this.hasher = hasher;
    this.tokens = tokens;
  }

  async ejecutar(solicitud: SolicitudInicioSesion): Promise<ResultadoInicioSesion> {
    const encontrado = await this.usuarios.buscarPorCorreo(normalizarCorreo(solicitud.correo));

    // Se compara una contraseña SIEMPRE, exista o no el usuario. Si no, responder
    // más rápido cuando el correo no existe permitiría descubrir qué correos están registrados.
    const hash = encontrado ? encontrado.passwordHash : await this.obtenerHashDeRelleno();
    const coincide = await this.hasher.verificar(solicitud.password, hash);

    // Un solo error para los tres casos (no existe, contraseña mala, desactivado):
    // así la respuesta no revela cuál fue.
    if (!encontrado || !coincide || !encontrado.activo) {
      throw new CredencialesInvalidasError();
    }

    const token = this.tokens.emitir({ usuarioId: encontrado.id, rol: encontrado.rol });
    return {
      token,
      usuario: {
        id: encontrado.id,
        correo: encontrado.correo,
        rol: encontrado.rol,
        activo: encontrado.activo,
      },
    };
  }

  private obtenerHashDeRelleno(): Promise<string> {
    this.hashDeRelleno ??= this.hasher.hash('contraseña-de-relleno');
    return this.hashDeRelleno;
  }
}