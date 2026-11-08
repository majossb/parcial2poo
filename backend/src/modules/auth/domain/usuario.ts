// Entidad Usuario y reglas de validación (RF-01, RF-11)
import type { Rol } from './rol.js';

export interface Usuario {
  readonly id: string;
  readonly correo: string;
  readonly rol: Rol;
  readonly activo: boolean;
}

// Solo se usa para verificar la contraseña al iniciar sesión.
// Nunca debe salir del módulo hacia la API.
export interface UsuarioConCredenciales extends Usuario {
  readonly passwordHash: string;
}

export class CredencialesInvalidasError extends Error {
  constructor(mensaje = 'Correo o contraseña incorrectos') {
    super(mensaje);
    this.name = 'CredencialesInvalidasError';
  }
}

export class CorreoYaRegistradoError extends Error {
  constructor(mensaje = 'Ya existe un usuario con ese correo') {
    super(mensaje);
    this.name = 'CorreoYaRegistradoError';
  }
}

export class DatosUsuarioInvalidosError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'DatosUsuarioInvalidosError';
  }
}

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LARGO_MAXIMO_CORREO = 255; // el tamaño de la columna en la base
export const LARGO_MINIMO_PASSWORD = 8;
const BYTES_MAXIMOS_PASSWORD = 72; // bcrypt ignora lo que pase de 72 bytes

// El índice único de la base ignora mayúsculas; normalizar evita sorpresas.
export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

export function validarCorreo(correo: string): void {
  if (correo.length > LARGO_MAXIMO_CORREO || !FORMATO_CORREO.test(correo)) {
    throw new DatosUsuarioInvalidosError('El correo no tiene un formato válido');
  }
}

export function validarPassword(password: string): void {
  if (password.length < LARGO_MINIMO_PASSWORD) {
    throw new DatosUsuarioInvalidosError(
      `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres`,
    );
  }
  if (new TextEncoder().encode(password).length > BYTES_MAXIMOS_PASSWORD) {
    throw new DatosUsuarioInvalidosError('La contraseña es demasiado larga (máximo 72 bytes)');
  }
}