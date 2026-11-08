// Hook para consultar el estado de la sincronización y disparar el envío de la cola (RF-08)
import { useCallback, useEffect, useRef, useState } from 'react';
import { colaMarcaciones, suscribirCola } from '../../../offline/cola-marcaciones.js';
import type { MarcacionLocal } from '../../../offline/db.js';
import { sincronizadorGlobal } from '../../../offline/sincronizador.js';
import { useSesion } from '../../auth/hooks/useSesion.js';

export interface EstadoSync {
  pendientes: number;
  rechazadas: MarcacionLocal[];
  sincronizando: boolean;
  ultimoResultado: string | null;
  sincronizarAhora: () => Promise<void>;
  descartarRechazada: (id: string) => Promise<void>;
}

export function useEstadoSync(): EstadoSync {
  const { sesion, marcarSesionVencida } = useSesion();
  const usuarioId = sesion?.usuario?.id;

  const [pendientes, setPendientes] = useState<number>(0);
  const [rechazadas, setRechazadas] = useState<MarcacionLocal[]>([]);
  const [sincronizando, setSincronizando] = useState<boolean>(false);
  const [ultimoResultado, setUltimoResultado] = useState<string | null>(null);

  const montadoRef = useRef(true);

  const actualizarDatos = useCallback(async () => {
    if (!usuarioId) {
      setPendientes(0);
      setRechazadas([]);
      return;
    }

    try {
      const [totalPendientes, todas] = await Promise.all([
        colaMarcaciones.contar(usuarioId),
        colaMarcaciones.listarDelUsuario(usuarioId),
      ]);

      if (montadoRef.current) {
        setPendientes(totalPendientes);
        setRechazadas(todas.filter((m: MarcacionLocal) => m.estado === 'rechazada'));
      }
    } catch {
      // Ignorar fallos de lectura de IndexedDB
    }
  }, [usuarioId]);

  useEffect(() => {
    montadoRef.current = true;
    actualizarDatos();

    const desuscribir = suscribirCola(() => {
      actualizarDatos();
    });

    return () => {
      montadoRef.current = false;
      desuscribir();
    };
  }, [actualizarDatos]);

  const sincronizarAhora = useCallback(async () => {
    if (!usuarioId || sincronizando) return;

    setSincronizando(true);
    try {
      const resultado = await sincronizadorGlobal.sincronizar(usuarioId);
      if (montadoRef.current) {
        setUltimoResultado(resultado.mensaje);
        if (resultado.tipo === 'sesion_vencida') {
          marcarSesionVencida();
        }
      }
    } catch (e) {
      if (montadoRef.current) {
        setUltimoResultado(e instanceof Error ? e.message : 'Error inesperado al sincronizar');
      }
    } finally {
      if (montadoRef.current) {
        setSincronizando(false);
      }
      await actualizarDatos();
    }
  }, [usuarioId, sincronizando, marcarSesionVencida, actualizarDatos]);

  const descartarRechazada = useCallback(
    async (id: string) => {
      await colaMarcaciones.eliminar(id);
      await actualizarDatos();
    },
    [actualizarDatos],
  );

  // Intentar sincronizar al volver a estar online o al montar si hay sesión de operario
  useEffect(() => {
    if (sesion?.usuario.rol === 'operario') {
      sincronizarAhora();
    }

    const alVolverEnLinea = () => {
      if (sesion?.usuario.rol === 'operario') {
        sincronizarAhora();
      }
    };

    window.addEventListener('online', alVolverEnLinea);
    return () => window.removeEventListener('online', alVolverEnLinea);
  }, [sesion?.usuario.rol, sincronizarAhora]);

  return {
    pendientes,
    rechazadas,
    sincronizando,
    ultimoResultado,
    sincronizarAhora,
    descartarRechazada,
  };
}
