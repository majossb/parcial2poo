import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from '../../src/modules/auth/infrastructure/security/bcrypt-password-hasher.js';

const hasher = new BcryptPasswordHasher();

describe('BcryptPasswordHasher', () => {
  it('verifica la contraseña correcta y rechaza la incorrecta', async () => {
    const hash = await hasher.hash('Clave-segura-1');
    expect(await hasher.verificar('Clave-segura-1', hash)).toBe(true);
    expect(await hasher.verificar('otra-clave', hash)).toBe(false);
  });

  it('no guarda la contraseña en claro y usa sal distinta cada vez', async () => {
    const a = await hasher.hash('Clave-segura-1');
    const b = await hasher.hash('Clave-segura-1');
    expect(a).not.toContain('Clave-segura-1');
    expect(a).not.toBe(b);
  });

  it('el hash del seed del administrador corresponde a Admin123!', async () => {
    const sql = readFileSync('database/seeds/001_roles_y_admin.sql', 'utf8');
    const hash = sql.match(/'(\$2[aby]\$\d\d\$[^']+)'/)?.[1];
    expect(hash, 'no se encontró el hash en el seed').toBeDefined();
    expect(await hasher.verificar('Admin123!', hash!)).toBe(true);
  });
});