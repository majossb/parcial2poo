import { describe, expect, it } from 'vitest';
import { esRol, rolCubre } from '../../src/modules/auth/domain/rol.js';

describe('roles', () => {
  it('reconoce solo los cuatro roles del sistema', () => {
    expect(esRol('operario')).toBe(true);
    expect(esRol('administrador')).toBe(true);
    expect(esRol('superadmin')).toBe(false);
    expect(esRol(undefined)).toBe(false);
  });

  it('cada rol se cubre a sí mismo', () => {
    expect(rolCubre('supervisor', 'supervisor')).toBe(true);
    expect(rolCubre('operario', 'operario')).toBe(true);
  });

  it('el administrador hereda lo del administrativo (generalización del diagrama)', () => {
    expect(rolCubre('administrador', 'administrativo')).toBe(true);
  });

  it('la herencia no va al revés ni se extiende a otros roles', () => {
    expect(rolCubre('administrativo', 'administrador')).toBe(false);
    expect(rolCubre('administrador', 'supervisor')).toBe(false);
    expect(rolCubre('administrador', 'operario')).toBe(false);
    expect(rolCubre('supervisor', 'administrativo')).toBe(false);
  });
});