// Pruebas unitarias de generación de UUID v4 compatible con diferentes entornos
import { describe, expect, it } from 'vitest';
import { generarUUID } from '../src/shared/utils/uuid.js';

const REGEX_UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generarUUID', () => {
  it('genera un UUID v4 válido usando crypto.randomUUID cuando está disponible', () => {
    const id = generarUUID();
    expect(id).toMatch(REGEX_UUID_V4);
  });

  it('genera un UUID v4 válido en fallback cuando crypto.randomUUID no existe', () => {
    const originalRandomUUID = crypto.randomUUID;
    try {
      // Simular contexto HTTP no seguro donde crypto.randomUUID es undefined
      // @ts-expect-error simulación de ausencia de randomUUID
      crypto.randomUUID = undefined;

      const id = generarUUID();
      expect(id).toMatch(REGEX_UUID_V4);
    } finally {
      crypto.randomUUID = originalRandomUUID;
    }
  });

  it('produce identificadores únicos consecutivamente', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = generarUUID();
      expect(ids.has(id)).toBe(false);
      ids.add(id);
    }
    expect(ids.size).toBe(100);
  });
});
