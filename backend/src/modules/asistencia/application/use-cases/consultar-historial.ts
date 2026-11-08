// Caso de uso: consultar historial de asistencia (RF-09)
import { construirJornadas } from '../../domain/jornada.js';
import type { Jornada } from '../../domain/jornada.js';
import type { Marcacion } from '../../domain/marcacion.js';
import type { FiltroMarcaciones, MarcacionRepository } from '../ports/marcacion-repository.js';

export class FiltroInvalidoError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'FiltroInvalidoError';
  }
}

export class ConsultarHistorial {
  private readonly marcaciones: MarcacionRepository;

  constructor(marcaciones: MarcacionRepository) {
    this.marcaciones = marcaciones;
  }

  async ejecutar(filtro: FiltroMarcaciones): Promise<{ marcaciones: Marcacion[]; jornadas: Jornada[] }> {
    if (filtro.desde.getTime() > filtro.hasta.getTime()) {
      throw new FiltroInvalidoError('"desde" no puede ser posterior a "hasta"');
    }
    const marcaciones = await this.marcaciones.listar(filtro);

    // Con el filtro "a revisar" la lista estÃ¡ incompleta y las jornadas saldrÃ­an engaÃ±osas.
    if (filtro.soloARevisar) return { marcaciones, jornadas: [] };

    const porOperario = new Map<string, Marcacion[]>();
    for (const m of marcaciones) {
      const lista = porOperario.get(m.operarioId) ?? [];
      lista.push(m);
      porOperario.set(m.operarioId, lista);
    }
    const jornadas = [...porOperario.values()].flatMap((lista) => construirJornadas(lista));
    return { marcaciones, jornadas };
  }
}