// Reglas: no hay salida sin entrada abierta, no hay dos entradas abiertas
// Una jornada es una entrada con su salida. Se calcula a partir de las
// marcaciones; no es una tabla (el historial sale de `marcaciones`).
import type { Marcacion } from './marcacion.js';

export interface Jornada {
  readonly operarioId: string;
  readonly entrada: Marcacion | null; // null = salida sin entrada (anomalÃ­a)
  readonly salida: Marcacion | null; // null = jornada abierta o entrada sin salida
  readonly duracionMinutos: number | null;
}

function crearJornada(entrada: Marcacion | null, salida: Marcacion | null): Jornada {
  const base = (entrada ?? salida) as Marcacion; // siempre hay al menos una
  const duracionMinutos =
    entrada && salida
      ? Math.round(
          (salida.registradaEnDispositivo.getTime() - entrada.registradaEnDispositivo.getTime()) / 60000,
        )
      : null;
  return { operarioId: base.operarioId, entrada, salida, duracionMinutos };
}

// Recibe las marcaciones de UN solo operario.
export function construirJornadas(marcaciones: readonly Marcacion[]): Jornada[] {
  const ordenadas = [...marcaciones].sort(
    (a, b) => a.registradaEnDispositivo.getTime() - b.registradaEnDispositivo.getTime(),
  );
  const jornadas: Jornada[] = [];
  let abierta: Marcacion | null = null;

  for (const m of ordenadas) {
    if (m.tipo === 'entrada') {
      if (abierta) jornadas.push(crearJornada(abierta, null)); // entrada anterior sin salida
      abierta = m;
    } else if (abierta) {
      jornadas.push(crearJornada(abierta, m));
      abierta = null;
    } else {
      jornadas.push(crearJornada(null, m)); // salida sin entrada
    }
  }
  if (abierta) jornadas.push(crearJornada(abierta, null));
  return jornadas;
}