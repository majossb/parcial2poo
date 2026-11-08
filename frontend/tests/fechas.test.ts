// Pruebas unitarias de formateo y cálculo de fechas en zona horaria de Colombia
import { describe, expect, it } from 'vitest';
import {
  finDelDia,
  formatearDuracion,
  formatearFechaHora,
  formatearHora,
  inicioDelDia,
} from '../src/shared/utils/fechas.js';

describe('Utilidades de fechas en hora de Colombia', () => {
  it('formatea la hora en zona horaria America/Bogota (UTC-5)', () => {
    // 13:03 UTC corresponde a 8:03 a.m. en Colombia
    const iso = '2026-11-08T13:03:00.000Z';
    const resultado = formatearHora(iso);
    // Limpiar caracteres invisibles de no-separación estrecha si existen
    const normalizado = resultado.replace(/\u202F/g, ' ');
    expect(normalizado).toMatch(/8:03\s*(a\.\s*m\.|AM)/i);
  });

  it('formatea fecha y hora completas en zona horaria de Colombia', () => {
    const iso = '2026-11-08T22:30:00.000Z'; // 17:30 (5:30 p.m.) en Colombia del 08/11/2026
    const resultado = formatearFechaHora(iso).replace(/\u202F/g, ' ');
    expect(resultado).toContain('8/11/2026');
    expect(resultado).toMatch(/5:30\s*(p\.\s*m\.|PM)/i);
  });

  it('formatearDuracion maneja minutos, horas exactas y combinadas', () => {
    expect(formatearDuracion(null)).toBe('-');
    expect(formatearDuracion(undefined)).toBe('-');
    expect(formatearDuracion(0)).toBe('0 min');
    expect(formatearDuracion(45)).toBe('45 min');
    expect(formatearDuracion(60)).toBe('1 h');
    expect(formatearDuracion(540)).toBe('9 h');
    expect(formatearDuracion(510)).toBe('8 h 30 min');
  });

  it('inicioDelDia convierte fecha YYYY-MM-DD al ISO 8601 en UTC del inicio del día en Colombia', () => {
    const iso = inicioDelDia('2026-11-08');
    // 00:00 en Colombia (-05:00) es 05:00 UTC
    expect(iso).toBe('2026-11-08T05:00:00.000Z');
  });

  it('finDelDia convierte fecha YYYY-MM-DD al ISO 8601 en UTC del fin del día en Colombia', () => {
    const iso = finDelDia('2026-11-08');
    // 23:59:59.999 en Colombia (-05:00) es 04:59:59.999 UTC del día siguiente
    expect(iso).toBe('2026-11-09T04:59:59.999Z');
  });
});
