// API de asistencia: llamadas HTTP para conjuntos, marcaciones e historial de jornadas (RF-06, RF-08)
import { db } from '../../../offline/db.js';
import type { ItemMarcacionSync, RespuestaServidorSync } from '../../../offline/sincronizador.js';
import { request } from '../../../shared/api/http-client.js';
import type { Conjunto, FiltrosHistorial, RespuestaHistorial } from '../types.js';

export async function apiListarConjuntos(token: string): Promise<Conjunto[]> {
  try {
    const respuesta = await request<{ conjuntos: Conjunto[] }>('/api/asistencia/conjuntos', {
      method: 'GET',
      token,
    });
    const lista = respuesta.conjuntos || [];

    // Guardar en caché local de IndexedDB para disponibilidad sin conexión
    if (lista.length > 0) {
      await db.conjuntos.bulkPut(lista).catch(() => {
        // Ignorar si falla la persistencia local
      });
    }

    return lista;
  } catch (error) {
    // Si no hay conexión, intentar devolver los conjuntos cacheados en IndexedDB
    const cacheados = await db.conjuntos.toArray().catch(() => []);
    if (cacheados.length > 0) {
      return cacheados;
    }
    throw error;
  }
}

export async function apiSincronizarMarcaciones(
  token: string,
  marcaciones: ItemMarcacionSync[],
): Promise<RespuestaServidorSync> {
  return request<RespuestaServidorSync>('/api/asistencia/marcaciones/sincronizar', {
    method: 'POST',
    token,
    body: { marcaciones },
  });
}

export async function apiConsultarHistorialPropio(
  token: string,
  desde: string,
  hasta: string,
): Promise<RespuestaHistorial> {
  const params = new URLSearchParams({ desde, hasta });
  return request<RespuestaHistorial>(`/api/asistencia/marcaciones/mias?${params.toString()}`, {
    method: 'GET',
    token,
  });
}

export async function apiConsultarHistorialGeneral(
  token: string,
  filtros: FiltrosHistorial,
): Promise<RespuestaHistorial> {
  const params = new URLSearchParams({
    desde: filtros.desde,
    hasta: filtros.hasta,
  });

  if (filtros.operarioId) params.append('operarioId', filtros.operarioId);
  if (filtros.conjuntoId) params.append('conjuntoId', filtros.conjuntoId);
  if (filtros.soloARevisar) params.append('soloARevisar', 'true');

  return request<RespuestaHistorial>(`/api/asistencia/marcaciones?${params.toString()}`, {
    method: 'GET',
    token,
  });
}
