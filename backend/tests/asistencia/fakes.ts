import type { Marcacion, TipoMarcacion } from '../../src/modules/asistencia/domain/marcacion.js';
import type {
  FiltroMarcaciones,
  MarcacionRepository,
} from '../../src/modules/asistencia/application/ports/marcacion-repository.js';
import type {
  OperarioResumen,
  OperariosGateway,
} from '../../src/modules/asistencia/application/ports/operarios-gateway.js';
import type { Reloj } from '../../src/modules/asistencia/application/ports/reloj.js';

export const OPERARIO = '11111111-1111-4111-8111-111111111111';
export const CONJUNTO = '22222222-2222-4222-8222-222222222222';
export const AHORA = new Date('2026-11-10T12:00:00Z');

export const uuid = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export function crearMarca(n: number, tipo: TipoMarcacion, hora: string): Marcacion {
  return {
    id: uuid(n),
    operarioId: OPERARIO,
    conjuntoId: CONJUNTO,
    tipo,
    registradaEnDispositivo: new Date(`2026-11-09T${hora}:00Z`),
    recibidaEnServidor: AHORA,
    estadoRevision: 'normal',
  };
}

export const relojFijo: Reloj = { ahora: () => AHORA };

export class OperariosFalso implements OperariosGateway {
  async buscarPorId(id: string): Promise<OperarioResumen | null> {
    return id === OPERARIO ? { id, activo: true } : null;
  }
}

export class MarcacionesEnMemoria implements MarcacionRepository {
  readonly guardadas: Marcacion[] = [];

  async guardar(m: Marcacion): Promise<boolean> {
    if (this.guardadas.some((x) => x.id === m.id)) return false;
    this.guardadas.push(m);
    return true;
  }

  async buscarUltimaAntesDe(operarioId: string, instante: Date): Promise<Marcacion | null> {
    const previas = this.guardadas
      .filter(
        (x) => x.operarioId === operarioId && x.registradaEnDispositivo.getTime() < instante.getTime(),
      )
      .sort((a, b) => a.registradaEnDispositivo.getTime() - b.registradaEnDispositivo.getTime());
    return previas.at(-1) ?? null;
  }

  async listar(f: FiltroMarcaciones): Promise<Marcacion[]> {
    return this.guardadas
      .filter(
        (x) =>
          (!f.operarioId || x.operarioId === f.operarioId) &&
          (!f.conjuntoId || x.conjuntoId === f.conjuntoId) &&
          x.registradaEnDispositivo.getTime() >= f.desde.getTime() &&
          x.registradaEnDispositivo.getTime() <= f.hasta.getTime() &&
          (!f.soloARevisar || x.estadoRevision === 'a_revisar'),
      )
      .sort((a, b) => a.registradaEnDispositivo.getTime() - b.registradaEnDispositivo.getTime());
  }
}