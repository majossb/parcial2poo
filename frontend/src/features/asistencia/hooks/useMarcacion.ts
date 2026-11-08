// Hook para registrar marcaciones fuera de línea con confirmación inmediata y selección de conjunto (RF-06, RF-08)
import { useCallback, useEffect, useState } from 'react';
import { colaMarcaciones, suscribirCola } from '../../../offline/cola-marcaciones.js';
import { db, type MarcacionLocal } from '../../../offline/db.js';
import { obtenerEstaEnLinea } from '../../../offline/detector-red.js';
import { sincronizadorGlobal } from '../../../offline/sincronizador.js';
import { formatearHora } from '../../../shared/utils/fechas.js';
import { generarUUID } from '../../../shared/utils/uuid.js';
import { apiListarConjuntos } from '../api/asistencia.api.js';
import { useSesion } from '../../auth/hooks/useSesion.js';
import type { Conjunto, TipoMarcacion } from '../types.js';

const CLAVE_ULTIMO_CONJUNTO = 'ultimo-conjunto-seleccionado';

export function useMarcacion() {
  const { sesion } = useSesion();
  const usuarioId = sesion?.usuario?.id;
  const token = sesion?.token;

  const [conjuntos, setConjuntos] = useState<Conjunto[]>([]);
  const [cargandoConjuntos, setCargandoConjuntos] = useState<boolean>(true);
  const [conjuntoSeleccionado, setConjuntoSeleccionado] = useState<string>('');
  const [ultimaMarcacion, setUltimaMarcacion] = useState<MarcacionLocal | null>(null);
  const [marcando, setMarcando] = useState<boolean>(false);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);
  const [errorConjunto, setErrorConjunto] = useState<string | null>(null);

  // Cargar lista de conjuntos (primero de caché o de red)
  useEffect(() => {
    let cancelado = false;

    const cargarConjuntos = async () => {
      setCargandoConjuntos(true);
      try {
        let lista: Conjunto[] = [];
        if (token) {
          try {
            lista = await apiListarConjuntos(token);
          } catch {
            // Si falla la red, cargar de la base local
            lista = await db.conjuntos.toArray();
          }
        } else {
          lista = await db.conjuntos.toArray();
        }

        if (!cancelado) {
          setConjuntos(lista);
          // Restaurar último conjunto elegido
          let idGuardado: string | null = null;
          try {
            idGuardado = localStorage.getItem(CLAVE_ULTIMO_CONJUNTO);
          } catch {
            // Ignorar
          }

          if (idGuardado && lista.some((c) => c.id === idGuardado)) {
            setConjuntoSeleccionado(idGuardado);
          } else if (lista.length === 1 && lista[0]) {
            setConjuntoSeleccionado(lista[0].id);
          }
        }
      } finally {
        if (!cancelado) setCargandoConjuntos(false);
      }
    };

    cargarConjuntos();

    return () => {
      cancelado = true;
    };
  }, [token]);

  // Consultar la última marcación para sugerir tipo
  const refrescarUltima = useCallback(async () => {
    if (!usuarioId) return;
    try {
      const ult = await colaMarcaciones.ultimaDelUsuario(usuarioId);
      setUltimaMarcacion(ult);
    } catch {
      // Ignorar
    }
  }, [usuarioId]);

  useEffect(() => {
    refrescarUltima();
    const desuscribir = suscribirCola(() => {
      refrescarUltima();
    });
    return desuscribir;
  }, [refrescarUltima]);

  const tipoRecomendado: TipoMarcacion =
    ultimaMarcacion && ultimaMarcacion.tipo === 'entrada' ? 'salida' : 'entrada';

  const marcar = async (tipo: TipoMarcacion) => {
    if (!usuarioId) return;

    if (!conjuntoSeleccionado) {
      setErrorConjunto('Debes seleccionar un conjunto residencial para marcar');
      return;
    }

    setErrorConjunto(null);
    setMarcando(true);

    const ahora = new Date();
    const iso = ahora.toISOString();
    const id = generarUUID();

    const nuevaMarcacion: MarcacionLocal = {
      id,
      usuarioId,
      conjuntoId: conjuntoSeleccionado,
      tipo,
      registradaEnDispositivo: iso,
      estado: 'pendiente',
      creadaLocalmente: iso,
    };

    try {
      // 1. Guardar primero en la cola local
      await colaMarcaciones.agregar(nuevaMarcacion);

      // Guardar último conjunto en localStorage
      try {
        localStorage.setItem(CLAVE_ULTIMO_CONJUNTO, conjuntoSeleccionado);
      } catch {
        // Ignorar
      }

      // 2. Mostrar confirmación inmediata
      const nombreTipo = tipo === 'entrada' ? 'Entrada' : 'Salida';
      const mensajeConfirmacion = `${nombreTipo} registrada a las ${formatearHora(ahora)}`;
      setConfirmacion(mensajeConfirmacion);

      // 3. Si hay conexión, intentar sincronizar en segundo plano sin esperar
      if (obtenerEstaEnLinea()) {
        sincronizadorGlobal.sincronizar(usuarioId).catch(() => {
          // Si falla, queda en la cola sin problema
        });
      }
    } finally {
      // Evitar doble toque accidental: 2 segundos de espera
      setTimeout(() => {
        setMarcando(false);
      }, 2000);
    }
  };

  return {
    conjuntos,
    cargandoConjuntos,
    conjuntoSeleccionado,
    setConjuntoSeleccionado,
    ultimaMarcacion,
    tipoRecomendado,
    marcando,
    confirmacion,
    errorConjunto,
    marcar,
  };
}
