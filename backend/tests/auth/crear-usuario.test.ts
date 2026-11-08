import { describe, expect, it } from 'vitest';
import { CrearUsuario } from '../../src/modules/auth/application/use-cases/crear-usuario.js';
import {
  CorreoYaRegistradoError,
  DatosUsuarioInvalidosError,
} from '../../src/modules/auth/domain/usuario.js';
import { HasherFalso, UsuariosEnMemoria } from './fakes.js';

function armar() {
  const usuarios = new UsuariosEnMemoria();
  return { usuarios, crearUsuario: new CrearUsuario(usuarios, new HasherFalso()) };
}

const valida = { correo: 'luis@empresa.local', password: 'Clave12345', rol: 'supervisor' };

describe('crear usuario (RF-11)', () => {
  it('crea el usuario con su rol y guarda el hash, no la contraseña', async () => {
    const { usuarios, crearUsuario } = armar();
    const u = await crearUsuario.ejecutar(valida);

    expect(u.rol).toBe('supervisor');
    expect(u.activo).toBe(true);
    expect(usuarios.guardados[0].passwordHash).toBe('hash(Clave12345)');
    expect(usuarios.guardados[0].passwordHash).not.toBe('Clave12345');
  });

  it('normaliza el correo a minúsculas y sin espacios', async () => {
    const { crearUsuario } = armar();
    const u = await crearUsuario.ejecutar({ ...valida, correo: '  Luis@Empresa.LOCAL ' });
    expect(u.correo).toBe('luis@empresa.local');
  });

  it('rechaza un correo con formato inválido', async () => {
    const { crearUsuario } = armar();
    await expect(crearUsuario.ejecutar({ ...valida, correo: 'sin-arroba' })).rejects.toBeInstanceOf(
      DatosUsuarioInvalidosError,
    );
  });

  it('rechaza una contraseña de menos de 8 caracteres', async () => {
    const { crearUsuario } = armar();
    await expect(crearUsuario.ejecutar({ ...valida, password: 'corta1' })).rejects.toBeInstanceOf(
      DatosUsuarioInvalidosError,
    );
  });

  it('rechaza una contraseña de más de 72 bytes (límite de bcrypt)', async () => {
    const { crearUsuario } = armar();
    await expect(
      crearUsuario.ejecutar({ ...valida, password: 'a'.repeat(73) }),
    ).rejects.toBeInstanceOf(DatosUsuarioInvalidosError);
  });

  it('rechaza un rol que no existe', async () => {
    const { crearUsuario } = armar();
    await expect(crearUsuario.ejecutar({ ...valida, rol: 'superadmin' })).rejects.toBeInstanceOf(
      DatosUsuarioInvalidosError,
    );
  });

  it('rechaza un correo repetido aunque cambien las mayúsculas', async () => {
    const { crearUsuario } = armar();
    await crearUsuario.ejecutar(valida);
    await expect(
      crearUsuario.ejecutar({ ...valida, correo: 'LUIS@empresa.local' }),
    ).rejects.toBeInstanceOf(CorreoYaRegistradoError);
  });
});