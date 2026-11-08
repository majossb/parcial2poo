// Puerto: acceso a marcaciones
import type { Marcacion } from '../../domain/marcacion.js';

export interface FiltroMarcaciones {
  operarioId?: string;
  conjuntoId?: string;
  desde: Date;
  hasta: Date;
  soloARevisar?: boolean;
}

export interface MarcacionRepository {
  // Devuelve true si la guardÃ³ y false si ya existÃ­a ese id (no duplica).
  guardar(marcacion: Marcacion): Promise<boolean>;
  // Ãšltima marcaciÃ³n del operario estrictamente anterior a ese instante.
  buscarUltimaAntesDe(operarioId: string, instante: Date): Promise<Marcacion | null>;
  // Ordenadas por registradaEnDispositivo, de la mÃ¡s antigua a la mÃ¡s reciente.
  listar(filtro: FiltroMarcaciones): Promise<Marcacion[]>;
}