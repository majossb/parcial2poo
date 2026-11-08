// Cliente HTTP: wrapper de fetch con timeout, manejo de errores tipados y cabeceras de autenticación
import { reportarEstadoRed } from '../../offline/detector-red.js';
export class ErrorApi extends Error {
  readonly estado: number;
  readonly detalle?: Array<{ campo: string; mensaje: string }>;

  constructor(estado: number, mensaje: string, detalle?: Array<{ campo: string; mensaje: string }>) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.detalle = detalle;
  }
}

export class ErrorDeRed extends Error {
  constructor(mensaje = 'No se pudo conectar con el servidor') {
    super(mensaje);
    this.name = 'ErrorDeRed';
  }
}

type ListenerSesionVencida = () => void;
const listenersSesionVencida: Set<ListenerSesionVencida> = new Set();

export function suscribirSesionVencida(listener: ListenerSesionVencida): () => void {
  listenersSesionVencida.add(listener);
  return () => listenersSesionVencida.delete(listener);
}

function notificarSesionVencida(): void {
  listenersSesionVencida.forEach((cb) => {
    try {
      cb();
    } catch {
      // Ignorar errores de suscriptores
    }
  });
}

export interface OpcionesRequest extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string;
  timeoutMs?: number;
}

const URL_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:3000';

export async function request<T>(ruta: string, opciones: OpcionesRequest = {}): Promise<T> {
  const { body, token, timeoutMs = 15000, headers: headersCustom, ...resto } = opciones;

  const url = ruta.startsWith('http') ? ruta : `${URL_BASE}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(headersCustom as Record<string, string>),
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const respuesta = await fetch(url, {
      ...resto,
      signal: controller.signal,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    clearTimeout(timeoutId);

    if (respuesta.status === 204) {
      return undefined as unknown as T;
    }

    const esJson = respuesta.headers.get('content-type')?.includes('application/json');
    const datos = esJson ? await respuesta.json().catch(() => null) : null;

    if (!respuesta.ok) {
      reportarEstadoRed(true);
      const mensaje = (datos && typeof datos.error === 'string') ? datos.error : `Error ${respuesta.status}`;
      const detalle = datos && Array.isArray(datos.detalle) ? datos.detalle : undefined;

      if (respuesta.status === 401 && !ruta.includes('/api/auth/login')) {
        notificarSesionVencida();
      }

      throw new ErrorApi(respuesta.status, mensaje, detalle);
    }

    reportarEstadoRed(true);
    return datos as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ErrorApi) {
      throw error;
    }
    reportarEstadoRed(false);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ErrorDeRed('La petición tardó demasiado tiempo en responder (tiempo de espera agotado)');
    }
    throw new ErrorDeRed(error instanceof Error ? error.message : 'Error de red o sin conexión');
  }
}
