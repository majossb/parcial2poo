// Base de datos IndexedDB local con Dexie para soporte fuera de línea
import Dexie, { type EntityTable } from 'dexie';

export interface MarcacionLocal {
  id: string;
  usuarioId: string;
  conjuntoId: string;
  tipo: 'entrada' | 'salida';
  registradaEnDispositivo: string;
  estado: 'pendiente' | 'rechazada';
  motivoRechazo?: string;
  creadaLocalmente: string;
}

export interface ConjuntoLocal {
  id: string;
  nombre: string;
  activo: boolean;
}

export class MantenimientoDB extends Dexie {
  marcacionesPendientes!: EntityTable<MarcacionLocal, 'id'>;
  conjuntos!: EntityTable<ConjuntoLocal, 'id'>;

  constructor() {
    super('mantenimiento');
    this.version(1).stores({
      marcacionesPendientes: 'id, usuarioId, estado',
      conjuntos: 'id',
    });
  }
}

export const db = new MantenimientoDB();
