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
  // Ref para evitar que dos sincronizaciones se solapen (sin causar re-renders)
  const sincronizandoRef = useRef(false);

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

  // sincronizarInterno recibe `manual` para saber si mostrar "nada_que_enviar"
  const sincronizarInterno = useCallback(async (manual: boolean) => {
    if (!usuarioId || sincronizandoRef.current) return;

    sincronizandoRef.current = true;
    setSincronizando(true);
    try {
      const resultado = await sincronizadorGlobal.sincronizar(usuarioId);
      if (montadoRef.current) {
        // Solo mostrar "nada_que_enviar" en sincronizaciones manuales
        if (resultado.tipo === 'nada_que_enviar' && !manual) {
          // Auto-sync silenciosa: no actualizamos el mensaje
        } else {
          setUltimoResultado(resultado.mensaje);
        }
        if (resultado.tipo === 'sesion_vencida') {
          marcarSesionVencida();
        }
      }
    } catch (e) {
      if (montadoRef.current) {
        setUltimoResultado(e instanceof Error ? e.message : 'Error inesperado al sincronizar');
      }
    } finally {
      sincronizandoRef.current = false;
      if (montadoRef.current) {
        setSincronizando(false);
      }
      await actualizarDatos();
    }
  }, [usuarioId, marcarSesionVencida, actualizarDatos]);

  // La función pública que expone el hook siempre es "manual"
  const sincronizarAhora = useCallback(async () => {
    await sincronizarInterno(true);
  }, [sincronizarInterno]);

  const descartarRechazada = useCallback(
    async (id: string) => {
      await colaMarcaciones.eliminar(id);
      await actualizarDatos();
    },
    [actualizarDatos],
  );

  // Sincronizar al montar (solo operario) y al volver a estar online.
  // Usa una ref estable para evitar que el efecto dependa de sincronizarInterno.
  const sincronizarInternoRef = useRef(sincronizarInterno);
  sincronizarInternoRef.current = sincronizarInterno;

  useEffect(() => {
    if (sesion?.usuario.rol === 'operario') {
      sincronizarInternoRef.current(false);
    }

    const alVolverEnLinea = () => {
      if (sesion?.usuario.rol === 'operario') {
        sincronizarInternoRef.current(false);
      }
    };

    window.addEventListener('online', alVolverEnLinea);
    return () => window.removeEventListener('online', alVolverEnLinea);
  }, [sesion?.usuario.rol]);

  return {
    pendientes,
    rechazadas,
    sincronizando,
    ultimoResultado,
    sincronizarAhora,
    descartarRechazada,
  };
}
