// Adaptador: hash de contraseñas con bcrypt
import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../../application/ports/password-hasher.js';

// Costo 10: es el mismo del hash del seed y mantiene el login bajo ~100 ms en servidores modestos.
const COSTO = 10;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return bcrypt.hash(password, COSTO);
  }

  verificar(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}