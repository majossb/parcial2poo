// Caso de uso: recibir lote de marcaciones sin duplicar por UUID (RF-08)
import { RegistrarMarcacion } from './registrar-marcacion.js';
import type { ResultadoRegistro, SolicitudMarcacion } from './registrar-marcacion.js';

// El operario NO viene en cada item: lo pone el controlador a partir del token,
// asÃ­ nadie puede sincronizar marcaciones a nombre de otro.
export type ItemLote = Omit<SolicitudMarcacion, 'operarioId'>;
export type ResultadoItem = ResultadoRegistro & { id: string };

function instante(item: ItemLote): number {
  const t = Date.parse(item.registradaEnDispositivo);
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t; // las fechas invÃ¡lidas van al final
}

export class SincronizarMarcaciones {
  private readonly registrar: RegistrarMarcacion;

  constructor(registrar: RegistrarMarcacion) {
    this.registrar = registrar;
  }

  async ejecutar(operarioId: string, lote: readonly ItemLote[]): Promise<ResultadoItem[]> {
    const ordenado = [...lote].sort((a, b) => instante(a) - instante(b));
    const resultados: ResultadoItem[] = [];

    // En serie a propÃ³sito: la regla de cada marcaciÃ³n depende de la anterior ya guardada.
    for (const item of ordenado) {
      const resultado = await this.registrar.ejecutar({ ...item, operarioId });
      resultados.push({ id: item.id, ...resultado });
    }
    return resultados;
  }
}