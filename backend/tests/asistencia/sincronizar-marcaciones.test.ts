import { describe, expect, it } from 'vitest';
import { RegistrarMarcacion } from '../../src/modules/asistencia/application/use-cases/registrar-marcacion.js';
import { SincronizarMarcaciones } from '../../src/modules/asistencia/application/use-cases/sincronizar-marcaciones.js';
import { CONJUNTO, MarcacionesEnMemoria, OPERARIO, OperariosFalso, relojFijo, uuid } from './fakes.js';

const item = (n: number, tipo: string, hora: string) => ({
  id: uuid(n),
  conjuntoId: CONJUNTO,
  tipo,
  registradaEnDispositivo: `2026-11-09T${hora}:00Z`,
});

function armar() {
  const repo = new MarcacionesEnMemoria();
  const registrar = new RegistrarMarcacion(repo, new OperariosFalso(), relojFijo);
  return { repo, sincronizar: new SincronizarMarcaciones(registrar) };
}

describe('sincronizar marcaciones (RF-08)', () => {
  it('ordena el lote por hora: una salida enviada primero no es anomalÃ­a', async () => {
    const { repo, sincronizar } = armar();
    const r = await sincronizar.ejecutar(OPERARIO, [item(2, 'salida', '16:00'), item(1, 'entrada', '08:00')]);
    expect(r.map((x) => x.id)).toEqual([uuid(1), uuid(2)]);
    expect(r).toMatchObject([
      { resultado: 'creada', estadoRevision: 'normal' },
      { resultado: 'creada', estadoRevision: 'normal' },
    ]);
    expect(repo.guardadas).toHaveLength(2);
  });

  it('reenviar el mismo lote no duplica nada', async () => {
    const { repo, sincronizar } = armar();
    const lote = [item(1, 'entrada', '08:00'), item(2, 'salida', '16:00')];
    await sincronizar.ejecutar(OPERARIO, lote);
    const segundo = await sincronizar.ejecutar(OPERARIO, lote);
    expect(segundo.every((x) => x.resultado === 'duplicada')).toBe(true);
    expect(repo.guardadas).toHaveLength(2);
  });

  it('una regla rota se guarda como a_revisar, no se descarta', async () => {
    const { repo, sincronizar } = armar();
    const r = await sincronizar.ejecutar(OPERARIO, [item(1, 'entrada', '08:00'), item(2, 'entrada', '09:00')]);
    expect(r[1]).toMatchObject({ resultado: 'creada', estadoRevision: 'a_revisar' });
    expect(repo.guardadas).toHaveLength(2);
  });

  it('rechaza marcaciones de un operario que no existe', async () => {
    const { repo, sincronizar } = armar();
    const r = await sincronizar.ejecutar('99999999-9999-4999-8999-999999999999', [item(1, 'entrada', '08:00')]);
    expect(r[0].resultado).toBe('rechazada');
    expect(repo.guardadas).toHaveLength(0);
  });
});