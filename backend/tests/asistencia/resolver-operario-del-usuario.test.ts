import { describe, expect, it } from 'vitest';
import {
  OperarioNoEncontradoError,
  ResolverOperarioDelUsuario,
} from '../../src/modules/asistencia/application/use-cases/resolver-operario-del-usuario.js';
import { OPERARIO, OperariosFalso, USUARIO } from './fakes.js';

describe('ResolverOperarioDelUsuario', () => {
  const caso = new ResolverOperarioDelUsuario(new OperariosFalso());

  it('devuelve el operario que corresponde al usuario del token', async () => {
    expect(await caso.ejecutar(USUARIO)).toEqual({ id: OPERARIO, activo: true });
  });

  it('lanza error si el usuario no tiene hoja de vida de operario', async () => {
    await expect(caso.ejecutar('99999999-9999-4999-8999-999999999999')).rejects.toBeInstanceOf(
      OperarioNoEncontradoError,
    );
  });
});
