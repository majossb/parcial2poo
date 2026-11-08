// Puerto: hash y verificación de contraseñas
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verificar(password: string, hash: string): Promise<boolean>;
}