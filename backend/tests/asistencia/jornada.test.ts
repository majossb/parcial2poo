import { describe, expect, it } from 'vitest';
import { construirJornadas } from '../../src/modules/asistencia/domain/jornada.js';
import { crearMarca } from './fakes.js';

describe('construirJornadas', () => {
  it('une una entrada con su salida y calcula la duraciÃ³n', () => {
    const j = construirJornadas([crearMarca(1, 'entrada', '08:00'), crearMarca(2, 'salida', '16:00')]);
    expect(j).toHaveLength(1);
    expect(j[0].duracionMinutos).toBe(480);
  });

  it('una entrada sin salida deja la jornada abierta', () => {
    const j = construirJornadas([crearMarca(1, 'entrada', '08:00')]);
    expect(j[0].salida).toBeNull();
    expect(j[0].duracionMinutos).toBeNull();
  });

  it('una salida sin entrada queda como anomalÃ­a', () => {
    const j = construirJornadas([crearMarca(1, 'salida', '16:00')]);
    expect(j[0].entrada).toBeNull();
  });

  it('dos entradas seguidas producen dos jornadas', () => {
    const j = construirJornadas([crearMarca(1, 'entrada', '08:00'), crearMarca(2, 'entrada', '09:00')]);
    expect(j).toHaveLength(2);
  });
});