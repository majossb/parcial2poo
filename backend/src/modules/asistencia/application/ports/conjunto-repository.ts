// Puerto: acceso a conjuntos residenciales
import type { Conjunto } from '../../domain/conjunto.js';

export interface ConjuntoRepository {
  // Solo los activos, ordenados por nombre.
  listarActivos(): Promise<Conjunto[]>;
}