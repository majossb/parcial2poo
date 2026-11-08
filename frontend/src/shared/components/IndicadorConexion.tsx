// Componente indicador de estado de conexión y contador de marcaciones pendientes en el dispositivo
import React, { useEffect, useState } from 'react';
import { useSesion } from '../../features/auth/hooks/useSesion.js';
import { colaMarcaciones, suscribirCola } from '../../offline/cola-marcaciones.js';
import { useEstaEnLinea } from '../../offline/detector-red.js';

export function IndicadorConexion() {
  const enLinea = useEstaEnLinea();
  const { sesion } = useSesion();
  const [pendientes, setPendientes] = useState<number>(0);

  useEffect(() => {
    let cancelado = false;

    const actualizarPendientes = async () => {
      if (!sesion?.usuario?.id) {
        setPendientes(0);
        return;
      }
      try {
        const total = await colaMarcaciones.contar(sesion.usuario.id);
        if (!cancelado) {
          setPendientes(total);
        }
      } catch {
        // En caso de error de lectura de IndexedDB, ignorar
      }
    };

    actualizarPendientes();
    const desuscribir = suscribirCola(() => {
      actualizarPendientes();
    });

    return () => {
      cancelado = true;
      desuscribir();
    };
  }, [sesion?.usuario?.id]);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span
        className={`indicador-conexion ${enLinea ? 'indicador-en-linea' : 'indicador-sin-conexion'}`}
        role="status"
        aria-live="polite"
      >
        {enLinea ? '● En línea' : '○ Sin conexión'}
      </span>

      {sesion && pendientes > 0 && (
        <span
          className="badge-pendientes"
          title={`${pendientes} marcación(es) pendiente(s) por enviar`}
          aria-label={`${pendientes} marcaciones pendientes`}
        >
          {pendientes} pendiente{pendientes === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}
