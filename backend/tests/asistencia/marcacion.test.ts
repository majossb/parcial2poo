import { describe, expect, it } from 'vitest';
import {
  crearMarcacion,
  MarcacionInvalidaError,
  motivosDeRevision,
} from '../../src/modules/asistencia/domain/marcacion.js';
import { AHORA, CONJUNTO, OPERARIO, crearMarca, uuid } from './fakes.js';

const hora = (h: string) => new Date(`2026-11-09T${h}:00Z`);

describe('reglas de marcaciÃ³n', () => {
  it('la primera entrada es normal', () => {
    expect(motivosDeRevision(null, 'entrada', hora('08:00'), AHORA)).toEqual([]);
  });

  it('entrada despuÃ©s de una salida es normal', () => {
    const anterior = crearMarca(1, 'salida', '16:00');
    expect(motivosDeRevision(anterior, 'entrada', hora('18:00'), AHORA)).toEqual([]);
  });

  it('dos entradas abiertas quedan a revisar', () => {
    const anterior = crearMarca(1, 'entrada', '08:00');
    expect(motivosDeRevision(anterior, 'entrada', hora('09:00'), AHORA)).toHaveLength(1);
  });

  it('salida sin entrada abierta queda a revisar', () => {
    expect(motivosDeRevision(null, 'salida', hora('16:00'), AHORA)).toHaveLength(1);
  });

  it('salida despuÃ©s de una entrada es normal', () => {
    const anterior = crearMarca(1, 'entrada', '08:00');
    expect(motivosDeRevision(anterior, 'salida', hora('16:00'), AHORA)).toEqual([]);
  });

  it('reloj adelantado mÃ¡s de 5 minutos queda a revisar; 3 minutos se tolera', () => {
    expect(motivosDeRevision(null, 'entrada', new Date('2026-11-10T12:10:00Z'), AHORA)).toHaveLength(1);
    expect(motivosDeRevision(null, 'entrada', new Date('2026-11-10T12:03:00Z'), AHORA)).toEqual([]);
  });
});

describe('crearMarcacion', () => {
  const datos = {
    id: uuid(1),
    operarioId: OPERARIO,
    conjuntoId: CONJUNTO,
    tipo: 'salida',
    registradaEnDispositivo: hora('16:00'),
  };

  it('marca a_revisar cuando hay motivos', () => {
    const { marcacion, motivos } = crearMarcacion(datos, null, AHORA);
    expect(marcacion.estadoRevision).toBe('a_revisar');
    expect(motivos).toHaveLength(1);
  });

  it('rechaza un tipo invÃ¡lido', () => {
    expect(() => crearMarcacion({ ...datos, tipo: 'almuerzo' }, null, AHORA)).toThrow(MarcacionInvalidaError);
  });

  it('rechaza un id que no es UUID', () => {
    expect(() => crearMarcacion({ ...datos, id: 'abc' }, null, AHORA)).toThrow(MarcacionInvalidaError);
  });
});