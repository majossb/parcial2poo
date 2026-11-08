import jwt from 'jsonwebtoken';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { JwtTokenService } from '../../src/modules/auth/infrastructure/security/jwt-token-service.js';

const SECRETO = 'secreto-de-pruebas';
const payload = { usuarioId: '3f1c2b1e-7a52-4e0c-9a58-0d1f6b9f0a11', rol: 'supervisor' } as const;

afterEach(() => {
  vi.useRealTimers();
});

describe('JwtTokenService', () => {
  const servicio = new JwtTokenService(SECRETO, '1h');

  it('un token válido devuelve el mismo usuario y rol', () => {
    expect(servicio.verificar(servicio.emitir(payload))).toEqual(payload);
  });

  it('rechaza un token firmado con otro secreto', () => {
    const ajeno = new JwtTokenService('otro-secreto-distinto', '1h').emitir(payload);
    expect(servicio.verificar(ajeno)).toBeNull();
  });

  it('rechaza un token vencido (reloj simulado: pasa más de 1 hora)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-10T08:00:00Z'));
    const token = servicio.emitir(payload);

    vi.setSystemTime(new Date('2026-11-10T08:59:00Z'));
    expect(servicio.verificar(token)).toEqual(payload);

    vi.setSystemTime(new Date('2026-11-10T09:00:01Z'));
    expect(servicio.verificar(token)).toBeNull();
  });

  it('rechaza un token alterado', () => {
    const [cabecera, cuerpo, firma] = servicio.emitir(payload).split('.');
    const falso = Buffer.from(JSON.stringify({ sub: payload.usuarioId, rol: 'administrador' })).toString('base64url');
    expect(cuerpo).not.toBe(falso);
    expect(servicio.verificar(`${cabecera}.${falso}.${firma}`)).toBeNull();
  });

  it('rechaza un token con un rol que no existe', () => {
    const token = jwt.sign({ rol: 'superusuario' }, SECRETO, { algorithm: 'HS256', subject: payload.usuarioId });
    expect(servicio.verificar(token)).toBeNull();
  });

  it('rechaza un token sin sujeto', () => {
    const token = jwt.sign({ rol: 'operario' }, SECRETO, { algorithm: 'HS256' });
    expect(servicio.verificar(token)).toBeNull();
  });

  it('solo acepta HS256 (rechaza HS512 y "alg: none")', () => {
    const hs512 = jwt.sign({ rol: 'operario' }, SECRETO, { algorithm: 'HS512', subject: payload.usuarioId });
    expect(servicio.verificar(hs512)).toBeNull();

    const cabecera = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const cuerpo = Buffer.from(JSON.stringify({ sub: payload.usuarioId, rol: 'administrador' })).toString('base64url');
    expect(servicio.verificar(`${cabecera}.${cuerpo}.`)).toBeNull();
  });

  it('rechaza texto que no es un token', () => {
    expect(servicio.verificar('hola')).toBeNull();
    expect(servicio.verificar('')).toBeNull();
  });
});