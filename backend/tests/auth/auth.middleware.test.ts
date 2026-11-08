import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../src/shared/errors/app-error.js';
import { crearAutenticar, exigirRol } from '../../src/modules/auth/infrastructure/http/auth.middleware.js';
import type { Rol } from '../../src/modules/auth/domain/rol.js';
import { TokensFalsos } from './fakes.js';

// Ejecuta un middleware y devuelve lo que le pasó a next().
function ejecutar(
  middleware: (req: Request, res: Response, next: (e?: unknown) => void) => void,
  req: Partial<Request>,
): unknown {
  const next = vi.fn();
  middleware(req as Request, {} as Response, next);
  expect(next).toHaveBeenCalledTimes(1);
  return next.mock.calls[0]?.[0];
}

const conCabecera = (valor?: string): Partial<Request> => ({
  headers: valor === undefined ? {} : { authorization: valor },
});

describe('autenticar', () => {
  const autenticar = crearAutenticar(new TokensFalsos());

  it('con un token válido deja pasar y guarda el usuario en la petición', () => {
    const req = conCabecera('Bearer abc|operario');
    expect(ejecutar(autenticar, req)).toBeUndefined();
    expect(req.usuario).toEqual({ usuarioId: 'abc', rol: 'operario' });
  });

  it.each([
    ['sin cabecera', undefined],
    ['esquema distinto de Bearer', 'Basic abc|operario'],
    ['sin token', 'Bearer'],
    ['con partes de más', 'Bearer abc|operario extra'],
    ['token inválido', 'Bearer basura'],
  ])('responde 401 %s', (_caso, cabecera) => {
    const error = ejecutar(autenticar, conCabecera(cabecera));
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).estado).toBe(401);
  });
});

describe('exigirRol', () => {
  const con = (rol: Rol): Partial<Request> => ({ usuario: { usuarioId: 'u1', rol } });

  it('sin usuario autenticado responde 401', () => {
    const error = ejecutar(exigirRol('administrador'), {});
    expect((error as AppError).estado).toBe(401);
  });

  it('un rol que no alcanza responde 403', () => {
    const error = ejecutar(exigirRol('administrador'), con('administrativo'));
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).estado).toBe(403);
  });

  it('el mismo rol pasa', () => {
    expect(ejecutar(exigirRol('supervisor'), con('supervisor'))).toBeUndefined();
  });

  it('el administrador pasa donde se pide administrativo (herencia)', () => {
    expect(ejecutar(exigirRol('administrativo'), con('administrador'))).toBeUndefined();
  });

  it('el administrativo no pasa donde se pide administrador', () => {
    const error = ejecutar(exigirRol('administrador'), con('administrativo'));
    expect((error as AppError).estado).toBe(403);
  });

  it('con varios roles permitidos pasa si cubre alguno', () => {
    expect(ejecutar(exigirRol('administrativo', 'supervisor'), con('supervisor'))).toBeUndefined();
    const error = ejecutar(exigirRol('administrativo', 'supervisor'), con('operario'));
    expect((error as AppError).estado).toBe(403);
  });
});