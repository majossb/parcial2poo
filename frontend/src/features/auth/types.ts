// Tipos de datos para el módulo de autenticación y sesión de usuario
export type Rol = 'administrador' | 'administrativo' | 'supervisor' | 'operario';

export interface Usuario {
  readonly id: string;
  readonly correo: string;
  readonly rol: Rol;
  readonly activo: boolean;
}

export interface Sesion {
  readonly token: string;
  readonly usuario: Usuario;
}

export interface RespuestaLogin {
  readonly token: string;
  readonly usuario: Usuario;
}
