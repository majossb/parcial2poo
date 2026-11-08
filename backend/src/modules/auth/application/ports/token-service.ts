// Puerto: emisión y validación de tokens
import type { Rol } from '../../domain/rol.js';

export interface PayloadToken {
  readonly usuarioId: string;
  readonly rol: Rol;
}

export interface TokenService {
  emitir(payload: PayloadToken): string;
  // null si el token es falso, fue alterado o ya venció
  verificar(token: string): PayloadToken | null;
}