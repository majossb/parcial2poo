// Entidad Marcación (entrada o salida) con UUID y hora del dispositivo
export type TipoMarcacion = 'entrada' | 'salida';
export type EstadoRevision = 'normal' | 'a_revisar';

export interface Marcacion {
  readonly id: string; // UUID generado por el celular
  readonly operarioId: string;
  readonly conjuntoId: string;
  readonly tipo: TipoMarcacion;
  readonly registradaEnDispositivo: Date;
  readonly recibidaEnServidor: Date;
  readonly estadoRevision: EstadoRevision;
}

export interface DatosMarcacion {
  id: string;
  operarioId: string;
  conjuntoId: string;
  tipo: string; // llega como texto desde afuera; aquí se valida
  registradaEnDispositivo: Date;
}

// Si la hora del celular supera la del servidor por más de esto, el reloj del
// dispositivo está mal puesto y la marcación se marca para revisión.
export const TOLERANCIA_RELOJ_MS = 5 * 60 * 1000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class MarcacionInvalidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'MarcacionInvalidaError';
  }
}

export function esTipoMarcacion(valor: string): valor is TipoMarcacion {
  return valor === 'entrada' || valor === 'salida';
}

// Datos mal formados: no se pueden guardar (no hay nada que revisar).
export function validarDatosMarcacion(datos: DatosMarcacion): void {
  const ids: [string, string][] = [
    ['id', datos.id],
    ['operarioId', datos.operarioId],
    ['conjuntoId', datos.conjuntoId],
  ];
  for (const [campo, valor] of ids) {
    if (!UUID.test(valor)) {
      throw new MarcacionInvalidaError(`${campo} no es un UUID válido`);
    }
  }
  if (!esTipoMarcacion(datos.tipo)) {
    throw new MarcacionInvalidaError('El tipo debe ser "entrada" o "salida"');
  }
  if (Number.isNaN(datos.registradaEnDispositivo.getTime())) {
    throw new MarcacionInvalidaError('La fecha de la marcación no es válida');
  }
}

// Datos bien formados pero que rompen una regla: se guardan y se marcan para revisión.
export function motivosDeRevision(
  anterior: Marcacion | null,
  tipo: TipoMarcacion,
  registradaEnDispositivo: Date,
  recibidaEnServidor: Date,
): string[] {
  const motivos: string[] = [];
  const entradaAbierta = anterior !== null && anterior.tipo === 'entrada';

  if (tipo === 'entrada' && entradaAbierta) {
    motivos.push('Ya había una entrada abierta sin salida');
  }
  if (tipo === 'salida' && !entradaAbierta) {
    motivos.push('Salida sin una entrada abierta');
  }
  const adelanto = registradaEnDispositivo.getTime() - recibidaEnServidor.getTime();
  if (adelanto > TOLERANCIA_RELOJ_MS) {
    motivos.push('La hora del dispositivo está adelantada respecto al servidor');
  }
  return motivos;
}

export function crearMarcacion(
  datos: DatosMarcacion,
  anterior: Marcacion | null,
  recibidaEnServidor: Date,
  motivosExternos: string[] = [], // reglas que el dominio no puede ver (p. ej. operario desactivado)
): { marcacion: Marcacion; motivos: string[] } {
  validarDatosMarcacion(datos);
  const tipo = datos.tipo as TipoMarcacion;
  const motivos = [
    ...motivosExternos,
    ...motivosDeRevision(anterior, tipo, datos.registradaEnDispositivo, recibidaEnServidor),
  ];
  const marcacion: Marcacion = {
    id: datos.id,
    operarioId: datos.operarioId,
    conjuntoId: datos.conjuntoId,
    tipo,
    registradaEnDispositivo: datos.registradaEnDispositivo,
    recibidaEnServidor,
    estadoRevision: motivos.length > 0 ? 'a_revisar' : 'normal',
  };
  return { marcacion, motivos };
}