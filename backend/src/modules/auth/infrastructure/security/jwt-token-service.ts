// Adaptador: tokens JWT (HS256) para el esquema Bearer
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { PayloadToken, TokenService } from '../../application/ports/token-service.js';
import { esRol } from '../../domain/rol.js';

export class JwtTokenService implements TokenService {
  private readonly secreto: string;
  private readonly expiracion: SignOptions['expiresIn'];

  constructor(secreto: string, expiracion: string = '1h') {
    this.secreto = secreto;
    this.expiracion = expiracion as SignOptions['expiresIn'];
  }

  emitir(payload: PayloadToken): string {
    return jwt.sign({ rol: payload.rol }, this.secreto, {
      algorithm: 'HS256',
      subject: payload.usuarioId,
      expiresIn: this.expiracion,
    });
  }

  verificar(token: string): PayloadToken | null {
    try {
      // Solo se acepta HS256: evita que alguien presente un token con "alg: none"
      // u otro algoritmo y se salte la verificación.
      const datos = jwt.verify(token, this.secreto, { algorithms: ['HS256'] });
      if (typeof datos === 'string') return null;
      const { sub, rol } = datos;
      if (typeof sub !== 'string' || !esRol(rol)) return null;
      return { usuarioId: sub, rol };
    } catch {
      return null; // firma inválida, alterado o vencido
    }
  }
}