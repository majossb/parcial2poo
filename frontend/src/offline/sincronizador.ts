// Sincronizador de marcaciones: procesa la cola local en lotes idempotentes hacia el servidor (RF-08)
import { ErrorApi } from '../shared/api/http-client.js';
import { colaMarcaciones } from './cola-marcaciones.js';
import type { MarcacionLocal } from './db.js';

export type ResultadoSyncTipo =
  | 'exito'
  | 'nada_que_enviar'
  | 'en_curso'
  | 'sesion_vencida'
  | 'sin_permiso'
  | 'sin_conexion';

export interface ItemMarcacionSync {
  id: string;
  conjuntoId: string;
  tipo: 'entrada' | 'salida';
  registradaEnDispositivo: string;
}

export interface ResultadoItemServidor {
  id: string;
  resultado: 'creada' | 'duplicada' | 'rechazada';
  estadoRevision?: 'normal' | 'a_revisar';
  motivo?: string;
  motivos?: string[];
}

export interface RespuestaServidorSync {
  resultados: ResultadoItemServidor[];
}

export interface ResultadoSincronizacion {
  tipo: ResultadoSyncTipo;
  mensaje: string;
  enviadas: number;
  duplicadas: number;
  rechazadas: number;
  paraRevision: number;
}

export interface ColaSync {
  pendientesDelUsuario(usuarioId: string): Promise<MarcacionLocal[]>;
  eliminar(ids: string[] | string): Promise<void>;
  marcarRechazada(id: string, motivo: string): Promise<void>;
}

export interface DependenciasSincronizador {
  cola: ColaSync;
  enviarLote: (token: string, lote: ItemMarcacionSync[]) => Promise<RespuestaServidorSync>;
  obtenerToken: () => Promise<string | null> | string | null;
}

export const TAMANO_MAX_LOTE = 200;

export class Sincronizador {
  private sincronizando = false;
  private readonly deps: DependenciasSincronizador;

  constructor(deps: DependenciasSincronizador) {
    this.deps = deps;
  }

  estaEnCurso(): boolean {
    return this.sincronizando;
  }

  async sincronizar(usuarioId: string): Promise<ResultadoSincronizacion> {
    if (this.sincronizando) {
      return {
        tipo: 'en_curso',
        mensaje: 'Hay una sincronización en curso',
        enviadas: 0,
        duplicadas: 0,
        rechazadas: 0,
        paraRevision: 0,
      };
    }

    this.sincronizando = true;

    try {
      const pendientes = await this.deps.cola.pendientesDelUsuario(usuarioId);
      if (pendientes.length === 0) {
        return {
          tipo: 'nada_que_enviar',
          mensaje: 'No hay marcaciones pendientes por enviar',
          enviadas: 0,
          duplicadas: 0,
          rechazadas: 0,
          paraRevision: 0,
        };
      }

      const token = await this.deps.obtenerToken();
      if (!token) {
        return {
          tipo: 'sesion_vencida',
          mensaje: 'Tu sesión ha vencido o no está disponible. Inicia sesión de nuevo',
          enviadas: 0,
          duplicadas: 0,
          rechazadas: 0,
          paraRevision: 0,
        };
      }

      let totalEnviadas = 0;
      let totalDuplicadas = 0;
      let totalRechazadas = 0;
      let totalParaRevision = 0;

      // Partir en lotes de máximo 200
      for (let i = 0; i < pendientes.length; i += TAMANO_MAX_LOTE) {
        const subconjunto = pendientes.slice(i, i + TAMANO_MAX_LOTE);
        const loteParaEnviar: ItemMarcacionSync[] = subconjunto.map((m) => ({
          id: m.id,
          conjuntoId: m.conjuntoId,
          tipo: m.tipo,
          registradaEnDispositivo: m.registradaEnDispositivo,
        }));

        let respuesta: RespuestaServidorSync;
        try {
          respuesta = await this.deps.enviarLote(token, loteParaEnviar);
        } catch (error) {
          if (error instanceof ErrorApi) {
            if (error.estado === 401) {
              return {
                tipo: 'sesion_vencida',
                mensaje: 'Tu sesión ha vencido. Por favor inicia sesión de nuevo',
                enviadas: totalEnviadas,
                duplicadas: totalDuplicadas,
                rechazadas: totalRechazadas,
                paraRevision: totalParaRevision,
              };
            }
            if (error.estado === 403) {
              return {
                tipo: 'sin_permiso',
                mensaje: error.message || 'Tu usuario no tiene una hoja de vida de operario',
                enviadas: totalEnviadas,
                duplicadas: totalDuplicadas,
                rechazadas: totalRechazadas,
                paraRevision: totalParaRevision,
              };
            }
          }

          // Error de red o 5xx: conservamos la cola completa y retornamos sin_conexion
          return {
            tipo: 'sin_conexion',
            mensaje: 'No hay conexión con el servidor. Tus marcaciones se conservan para reintentar luego',
            enviadas: totalEnviadas,
            duplicadas: totalDuplicadas,
            rechazadas: totalRechazadas,
            paraRevision: totalParaRevision,
          };
        }

        // Procesar resultados por ítem
        for (const item of respuesta.resultados) {
          if (item.resultado === 'creada' || item.resultado === 'duplicada') {
            await this.deps.cola.eliminar(item.id);
            if (item.resultado === 'creada') {
              totalEnviadas++;
              if (item.estadoRevision === 'a_revisar') {
                totalParaRevision++;
              }
            } else {
              totalDuplicadas++;
            }
          } else if (item.resultado === 'rechazada') {
            totalRechazadas++;
            const motivo =
              item.motivo ||
              (Array.isArray(item.motivos) && item.motivos.length > 0 ? item.motivos.join(', ') : 'Datos inválidos');
            await this.deps.cola.marcarRechazada(item.id, motivo);
          }
        }
      }

      // Mensaje resumen
      const partesMensaje: string[] = [];
      if (totalEnviadas > 0) {
        partesMensaje.push(`Se sincronizaron ${totalEnviadas} marcación(es) con éxito.`);
      }
      if (totalDuplicadas > 0) {
        partesMensaje.push(`${totalDuplicadas} ya estaban registradas.`);
      }
      if (totalParaRevision > 0) {
        partesMensaje.push(`${totalParaRevision} quedó para revisión del administrativo.`);
      }
      if (totalRechazadas > 0) {
        partesMensaje.push(`${totalRechazadas} fue rechazada por datos inválidos.`);
      }

      return {
        tipo: 'exito',
        mensaje: partesMensaje.join(' ') || 'Sincronización finalizada.',
        enviadas: totalEnviadas,
        duplicadas: totalDuplicadas,
        rechazadas: totalRechazadas,
        paraRevision: totalParaRevision,
      };
    } finally {
      this.sincronizando = false;
    }
  }
}

// Envío real al endpoint de sincronización
import { request } from '../shared/api/http-client.js';

async function enviarLoteReal(token: string, lote: ItemMarcacionSync[]): Promise<RespuestaServidorSync> {
  return request<RespuestaServidorSync>('/api/asistencia/marcaciones/sincronizar', {
    method: 'POST',
    token,
    body: { marcaciones: lote },
  });
}

function obtenerTokenReal(): string | null {
  try {
    const raw = localStorage.getItem('sesion-mantenimiento');
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s?.token ?? null;
  } catch {
    return null;
  }
}

export const sincronizadorGlobal = new Sincronizador({
  cola: colaMarcaciones,
  enviarLote: enviarLoteReal,
  obtenerToken: obtenerTokenReal,
});
