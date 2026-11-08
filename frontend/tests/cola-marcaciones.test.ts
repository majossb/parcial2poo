// Pruebas unitarias de la cola de marcaciones pendientes en IndexedDB
import { beforeEach, describe, expect, it } from 'vitest';
import { db, type MarcacionLocal } from '../src/offline/db.js';
import { colaMarcaciones } from '../src/offline/cola-marcaciones.js';

describe('Cola de marcaciones', () => {
  const usuario1 = 'usuario-uuid-1';
  const usuario2 = 'usuario-uuid-2';

  beforeEach(async () => {
    await db.marcacionesPendientes.clear();
  });

  const crearMarca = (id: string, usuarioId: string, tipo: 'entrada' | 'salida', hora: string): MarcacionLocal => ({
    id,
    usuarioId,
    conjuntoId: 'conjunto-1',
    tipo,
    registradaEnDispositivo: `2026-11-08T${hora}:00.000Z`,
    estado: 'pendiente',
    creadaLocalmente: `2026-11-08T${hora}:00.000Z`,
  });

  it('agrega marcaciones y las lista filtradas por usuario en orden temporal', async () => {
    await colaMarcaciones.agregar(crearMarca('m1', usuario1, 'salida', '17:00'));
    await colaMarcaciones.agregar(crearMarca('m2', usuario1, 'entrada', '08:00'));
    await colaMarcaciones.agregar(crearMarca('m3', usuario2, 'entrada', '09:00'));

    const delUsuario1 = await colaMarcaciones.listarDelUsuario(usuario1);
    expect(delUsuario1).toHaveLength(2);
    expect(delUsuario1.map((m) => m.id)).toEqual(['m2', 'm1']);

    const delUsuario2 = await colaMarcaciones.listarDelUsuario(usuario2);
    expect(delUsuario2).toHaveLength(1);
    expect(delUsuario2[0]?.id).toBe('m3');
  });

  it('cuenta correctamente las marcaciones con estado pendiente por usuario', async () => {
    await colaMarcaciones.agregar(crearMarca('m1', usuario1, 'entrada', '08:00'));
    await colaMarcaciones.agregar(crearMarca('m2', usuario1, 'salida', '12:00'));

    expect(await colaMarcaciones.contar(usuario1)).toBe(2);
    expect(await colaMarcaciones.contar(usuario2)).toBe(0);
  });

  it('marca una marcación como rechazada con su motivo', async () => {
    await colaMarcaciones.agregar(crearMarca('m1', usuario1, 'salida', '12:00'));

    await colaMarcaciones.marcarRechazada('m1', 'Secuencia rota');

    const lista = await colaMarcaciones.listarDelUsuario(usuario1);
    expect(lista).toHaveLength(1);
    expect(lista[0]?.estado).toBe('rechazada');
    expect(lista[0]?.motivoRechazo).toBe('Secuencia rota');

    // No debe aparecer en pendientes
    const pendientes = await colaMarcaciones.pendientesDelUsuario(usuario1);
    expect(pendientes).toHaveLength(0);
    expect(await colaMarcaciones.contar(usuario1)).toBe(0);
  });

  it('elimina marcaciones por lista de ids', async () => {
    await colaMarcaciones.agregar(crearMarca('m1', usuario1, 'entrada', '08:00'));
    await colaMarcaciones.agregar(crearMarca('m2', usuario1, 'salida', '12:00'));
    await colaMarcaciones.agregar(crearMarca('m3', usuario1, 'entrada', '13:00'));

    await colaMarcaciones.eliminar(['m1', 'm2']);

    const restantes = await colaMarcaciones.listarDelUsuario(usuario1);
    expect(restantes).toHaveLength(1);
    expect(restantes[0]?.id).toBe('m3');
  });

  it('obtiene la última marcación registrada por el usuario', async () => {
    expect(await colaMarcaciones.ultimaDelUsuario(usuario1)).toBeNull();

    await colaMarcaciones.agregar(crearMarca('m1', usuario1, 'entrada', '08:00'));
    await colaMarcaciones.agregar(crearMarca('m2', usuario1, 'salida', '17:00'));
    await colaMarcaciones.agregar(crearMarca('m3', usuario1, 'entrada', '13:00'));

    const ultima = await colaMarcaciones.ultimaDelUsuario(usuario1);
    expect(ultima?.id).toBe('m2');
    expect(ultima?.tipo).toBe('salida');
  });
});
