// Tipos de datos para el módulo de asistencia, marcaciones, jornadas y conjuntos (RF-06, RF-08)
export type TipoMarcacion = 'entrada' | 'salida';
export type EstadoRevision = 'normal' | 'a_revisar';

export interface Conjunto {
  readonly id: string;
  readonly nombre: string;
  readonly activo: boolean;
}

export interface Marcacion {
  readonly id: string;
  readonly operarioId: string;
  readonly conjuntoId: string;
  readonly tipo: TipoMarcacion;
  readonly registradaEnDispositivo: string;
  readonly recibidaEnServidor: string;
  readonly estadoRevision: EstadoRevision;
}

export interface Jornada {
  readonly operarioId: string;
  readonly entrada: Marcacion | null;
  readonly salida: Marcacion | null;
  readonly duracionMinutos: number | null;
}

export interface RespuestaHistorial {
  readonly marcaciones: readonly Marcacion[];
  readonly jornadas: readonly Jornada[];
}

export interface FiltrosHistorial {
  readonly desde: string; // ISO 8601 UTC
  readonly hasta: string; // ISO 8601 UTC
  readonly operarioId?: string;
  readonly conjuntoId?: string;
  readonly soloARevisar?: boolean;
}
