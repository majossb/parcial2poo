// Puerto: acceso a usuarios
import type { Rol } from '../../domain/rol.js';
import type { Usuario, UsuarioConCredenciales } from '../../domain/usuario.js';

export interface DatosNuevoUsuario {
  correo: string; // ya normalizado
  passwordHash: string;
  rol: Rol;
}

export interface UsuarioRepository {
  // La búsqueda no distingue mayúsculas.
  buscarPorCorreo(correo: string): Promise<UsuarioConCredenciales | null>;
  // Lanza CorreoYaRegistradoError si el correo ya existe.
  crear(datos: DatosNuevoUsuario): Promise<Usuario>;
}