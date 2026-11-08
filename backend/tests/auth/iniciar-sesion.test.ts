import { describe, expect, it } from 'vitest';
import { IniciarSesion } from '../../src/modules/auth/application/use-cases/iniciar-sesion.js';
import { CredencialesInvalidasError } from '../../src/modules/auth/domain/usuario.js';
import { HasherFalso, TokensFalsos, UsuariosEnMemoria } from './fakes.js';

const ID = '11111111-1111-4111-8111-111111111111';

function armar(activo = true) {
  const usuarios = new UsuariosEnMemoria();
  usuarios.guardados.push({
    id: ID,
    correo: 'ana@empresa.local',
    rol: 'operario',
    activo,
    passwordHash: 'hash(Secreta123)',
  });
  const hasher = new HasherFalso();
  return { hasher, iniciarSesion: new IniciarSesion(usuarios, hasher, new TokensFalsos()) };
}

describe('iniciar sesión (RF-01)', () => {
  it('con credenciales correctas devuelve token y usuario, sin el hash', async () => {
    const { iniciarSesion } = armar();
    const r = await iniciarSesion.ejecutar({ correo: 'ana@empresa.local', password: 'Secreta123' });

    expect(r.token).toBe(`${ID}|operario`);
    expect(r.usuario).toEqual({ id: ID, correo: 'ana@empresa.local', rol: 'operario', activo: true });
    expect(Object.keys(r.usuario)).not.toContain('passwordHash');
  });

  it('acepta el correo con mayúsculas y espacios', async () => {
    const { iniciarSesion } = armar();
    const r = await iniciarSesion.ejecutar({ correo: '  ANA@Empresa.Local ', password: 'Secreta123' });
    expect(r.usuario.id).toBe(ID);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const { iniciarSesion } = armar();
    await expect(
      iniciarSesion.ejecutar({ correo: 'ana@empresa.local', password: 'otra-cosa' }),
    ).rejects.toBeInstanceOf(CredencialesInvalidasError);
  });

  it('rechaza un correo que no existe', async () => {
    const { iniciarSesion } = armar();
    await expect(
      iniciarSesion.ejecutar({ correo: 'nadie@empresa.local', password: 'Secreta123' }),
    ).rejects.toBeInstanceOf(CredencialesInvalidasError);
  });

  it('rechaza a un usuario desactivado aunque la contraseña sea correcta', async () => {
    const { iniciarSesion } = armar(false);
    await expect(
      iniciarSesion.ejecutar({ correo: 'ana@empresa.local', password: 'Secreta123' }),
    ).rejects.toBeInstanceOf(CredencialesInvalidasError);
  });

  it('los tres fallos dan exactamente el mismo mensaje (no revelan cuál fue)', async () => {
    const mensajes: string[] = [];
    const casos = [
      { activo: true, correo: 'ana@empresa.local', password: 'mala' },
      { activo: true, correo: 'nadie@empresa.local', password: 'Secreta123' },
      { activo: false, correo: 'ana@empresa.local', password: 'Secreta123' },
    ];
    for (const c of casos) {
      const { iniciarSesion } = armar(c.activo);
      try {
        await iniciarSesion.ejecutar({ correo: c.correo, password: c.password });
      } catch (e) {
        mensajes.push((e as Error).message);
      }
    }
    expect(mensajes).toHaveLength(3);
    expect(new Set(mensajes).size).toBe(1);
  });

  it('con un correo inexistente igual se verifica una contraseña (iguala los tiempos)', async () => {
    const { iniciarSesion, hasher } = armar();
    await iniciarSesion
      .ejecutar({ correo: 'nadie@empresa.local', password: 'Secreta123' })
      .catch(() => undefined);
    expect(hasher.verificaciones).toBe(1);
  });
});