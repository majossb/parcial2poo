// Componente de lista de marcaciones en el dispositivo: pendientes de envío y rechazadas (RF-08)
import React, { useEffect, useState } from 'react';
import { colaMarcaciones, suscribirCola } from '../../../offline/cola-marcaciones.js';
import type { MarcacionLocal } from '../../../offline/db.js';
import { formatearFechaHora } from '../../../shared/utils/fechas.js';
import { useSesion } from '../../auth/hooks/useSesion.js';
import type { Conjunto } from '../types.js';

export interface ListaPendientesProps {
  readonly conjuntos: readonly Conjunto[];
  readonly rechazadas: readonly MarcacionLocal[];
  readonly onDescartarRechazada: (id: string) => void;
}

export function ListaPendientes({
  conjuntos,
  rechazadas,
  onDescartarRechazada,
}: ListaPendientesProps) {
  const { sesion } = useSesion();
  const usuarioId = sesion?.usuario?.id;
  const [pendientes, setPendientes] = useState<MarcacionLocal[]>([]);

  useEffect(() => {
    let cancelado = false;

    const cargarPendientes = async () => {
      if (!usuarioId) return;
      try {
        const lista = await colaMarcaciones.pendientesDelUsuario(usuarioId);
        if (!cancelado) setPendientes(lista);
      } catch {
        // Ignorar
      }
    };

    cargarPendientes();
    const desuscribir = suscribirCola(() => {
      cargarPendientes();
    });

    return () => {
      cancelado = true;
      desuscribir();
    };
  }, [usuarioId]);

  const nombreConjunto = (id: string): string => {
    const c = conjuntos.find((item) => item.id === id);
    return c ? c.nombre : id.slice(0, 8);
  };

  if (pendientes.length === 0 && rechazadas.length === 0) {
    return null;
  }

  return (
    <div className="tarjeta margen-superior">
      <h3 className="tarjeta-titulo">Marcaciones en este dispositivo</h3>

      {/* Marcaciones rechazadas por el servidor */}
      {rechazadas.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ color: 'var(--color-peligro)', fontSize: '0.95rem', marginBottom: '8px' }}>
            Marcaciones rechazadas ({rechazadas.length})
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-texto-muted)', marginBottom: '8px' }}>
            El servidor rechazó estas marcaciones debido a datos inválidos. Puedes revisarlas y descartarlas.
          </p>
          <ul className="lista-pendientes">
            {rechazadas.map((m) => (
              <li key={m.id} className="item-pendiente rechazada">
                <div className="item-pendiente-fila">
                  <div>
                    <strong>
                      {m.tipo === 'entrada' ? 'Entrada' : 'Salida'} - {nombreConjunto(m.conjuntoId)}
                    </strong>
                    <div>{formatearFechaHora(m.registradaEnDispositivo)}</div>
                    {m.motivoRechazo && (
                      <div style={{ color: 'var(--color-peligro)', marginTop: '4px', fontWeight: 500 }}>
                        Motivo: {m.motivoRechazo}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-descartar"
                    onClick={() => onDescartarRechazada(m.id)}
                    aria-label={`Descartar marcación de ${m.tipo}`}
                  >
                    Descartar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Marcaciones pendientes por sincronizar */}
      {pendientes.length > 0 && (
        <div>
          <h4 style={{ color: 'var(--color-aviso)', fontSize: '0.95rem', marginBottom: '8px' }}>
            Pendientes por sincronizar ({pendientes.length})
          </h4>
          <ul className="lista-pendientes">
            {pendientes.map((m) => (
              <li key={m.id} className="item-pendiente">
                <div className="item-pendiente-fila">
                  <div>
                    <strong>
                      {m.tipo === 'entrada' ? 'Entrada' : 'Salida'} - {nombreConjunto(m.conjuntoId)}
                    </strong>
                    <div>{formatearFechaHora(m.registradaEnDispositivo)}</div>
                  </div>
                  <span className="chip-revisar" style={{ backgroundColor: 'var(--color-aviso-fondo)' }}>
                    En espera
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
