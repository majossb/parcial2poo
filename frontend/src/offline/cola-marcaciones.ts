// Cola de marcaciones pendientes en IndexedDB: gestiona almacenamiento local por usuario
import { db as defaultDb, type MantenimientoDB, type MarcacionLocal } from './db.js';

type ListenerCola = () => void;
const listenersCola: Set<ListenerCola> = new Set();

export function suscribirCola(listener: ListenerCola): () => void {
  listenersCola.add(listener);
  return () => listenersCola.delete(listener);
}

function notificarCambioCola(): void {
  listenersCola.forEach((cb) => {
    try {
      cb();
    } catch {
      // Ignorar fallos de suscriptores
    }
  });
}

export function crearColaMarcaciones(database: MantenimientoDB = defaultDb) {
  return {
    async agregar(marcacion: MarcacionLocal): Promise<void> {
      await database.marcacionesPendientes.put(marcacion);
      notificarCambioCola();
    },

    async listarDelUsuario(usuarioId: string): Promise<MarcacionLocal[]> {
      const lista = await database.marcacionesPendientes
        .where('usuarioId')
        .equals(usuarioId)
        .toArray();

      return lista.sort(
        (a, b) => new Date(a.registradaEnDispositivo).getTime() - new Date(b.registradaEnDispositivo).getTime(),
      );
    },

    async pendientesDelUsuario(usuarioId: string): Promise<MarcacionLocal[]> {
      const lista = await database.marcacionesPendientes
        .where('usuarioId')
        .equals(usuarioId)
        .filter((m) => m.estado === 'pendiente')
        .toArray();

      return lista.sort(
        (a, b) => new Date(a.registradaEnDispositivo).getTime() - new Date(b.registradaEnDispositivo).getTime(),
      );
    },

    async marcarRechazada(id: string, motivo: string): Promise<void> {
      await database.marcacionesPendientes.update(id, {
        estado: 'rechazada',
        motivoRechazo: motivo,
      });
      notificarCambioCola();
    },

    async eliminar(ids: string[] | string): Promise<void> {
      const arrayIds = Array.isArray(ids) ? ids : [ids];
      if (arrayIds.length === 0) return;
      await database.marcacionesPendientes.bulkDelete(arrayIds);
      notificarCambioCola();
    },

    async contar(usuarioId: string): Promise<number> {
      return database.marcacionesPendientes
        .where('usuarioId')
        .equals(usuarioId)
        .filter((m) => m.estado === 'pendiente')
        .count();
    },

    async ultimaDelUsuario(usuarioId: string): Promise<MarcacionLocal | null> {
      const lista = await database.marcacionesPendientes
        .where('usuarioId')
        .equals(usuarioId)
        .toArray();

      if (lista.length === 0) return null;

      lista.sort(
        (a, b) => new Date(b.registradaEnDispositivo).getTime() - new Date(a.registradaEnDispositivo).getTime(),
      );
      return lista[0] ?? null;
    },
  };
}

export const colaMarcaciones = crearColaMarcaciones(defaultDb);
