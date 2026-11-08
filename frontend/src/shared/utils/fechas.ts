// Utilidad: formateo de fechas y horas en zona horaria de Colombia (America/Bogota)
const ZONA_COLOMBIA = 'America/Bogota';

const formateadorFechaHora = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA_COLOMBIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const formateadorHora = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA_COLOMBIA,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function formatearFechaHora(fecha: string | Date | null | undefined): string {
  if (!fecha) return '-';
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  if (isNaN(d.getTime())) return '-';
  return formateadorFechaHora.format(d);
}

export function formatearHora(fecha: string | Date | null | undefined): string {
  if (!fecha) return '-';
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  if (isNaN(d.getTime())) return '-';
  return formateadorHora.format(d);
}

export function formatearDuracion(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined) return '-';
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h > 0 && m > 0) return `${h} h ${m} min`;
  if (h > 0) return `${h} h`;
  return `${m} min`;
}

// Convierte una fecha YYYY-MM-DD al ISO 8601 del inicio del día (00:00:00.000) en Colombia (-05:00)
export function inicioDelDia(fechaStr: string): string {
  return new Date(`${fechaStr}T00:00:00.000-05:00`).toISOString();
}

// Convierte una fecha YYYY-MM-DD al ISO 8601 del fin del día (23:59:59.999) en Colombia (-05:00)
export function finDelDia(fechaStr: string): string {
  return new Date(`${fechaStr}T23:59:59.999-05:00`).toISOString();
}

// Obtiene la fecha YYYY-MM-DD actual en hora de Colombia
export function fechaHoyColombia(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_COLOMBIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// Resta días a una fecha YYYY-MM-DD en hora de Colombia
export function restarDias(fechaStr: string, dias: number): string {
  const d = new Date(`${fechaStr}T12:00:00.000-05:00`);
  d.setDate(d.getDate() - dias);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_COLOMBIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}
