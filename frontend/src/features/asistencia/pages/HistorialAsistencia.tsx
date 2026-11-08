// Pantalla de consulta de historial de marcaciones y jornadas con filtros de fecha y estado (RF-07)
import React, { useEffect, useState } from 'react';
import { db } from '../../../offline/db.js';
import { useEstaEnLinea } from '../../../offline/detector-red.js';
import { ErrorDeRed } from '../../../shared/api/http-client.js';
import { Tabla, type Columna } from '../../../shared/components/Tabla.js';
import {
  fechaHoyColombia,
  finDelDia,
  formatearDuracion,
  formatearFechaHora,
  inicioDelDia,
  restarDias,
} from '../../../shared/utils/fechas.js';
import {
  apiConsultarHistorialGeneral,
  apiConsultarHistorialPropio,
  apiListarConjuntos,
} from '../api/asistencia.api.js';
import { useSesion } from '../../auth/hooks/useSesion.js';
import type { Conjunto, Jornada, Marcacion } from '../types.js';

export function HistorialAsistencia() {
  const { sesion } = useSesion();
  const enLinea = useEstaEnLinea();
  const token = sesion?.token;
  const rol = sesion?.usuario?.rol;
  const esOperario = rol === 'operario';

  const hoy = fechaHoyColombia();
  const [desdeDate, setDesdeDate] = useState<string>(() => restarDias(hoy, 7));
  const [hastaDate, setHastaDate] = useState<string>(() => hoy);
  const [conjuntoIdFiltro, setConjuntoIdFiltro] = useState<string>('');
  const [soloARevisar, setSoloARevisar] = useState<boolean>(false);

  const [conjuntos, setConjuntos] = useState<Conjunto[]>([]);
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([]);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de conjuntos para resolver nombres en la tabla y en el filtro
  useEffect(() => {
    const cargarConjuntos = async () => {
      try {
        let lista: Conjunto[] = [];
        if (token) {
          try {
            lista = await apiListarConjuntos(token);
          } catch {
            lista = await db.conjuntos.toArray();
          }
        } else {
          lista = await db.conjuntos.toArray();
        }
        setConjuntos(lista);
      } catch {
        // Ignorar
      }
    };
    cargarConjuntos();
  }, [token]);

  const consultarHistorial = async () => {
    if (!token) return;

    if (!enLinea) {
      setError('El historial requiere conexión');
      return;
    }

    // Validación de rango de fechas en cliente
    const diffMs = new Date(`${hastaDate}T12:00:00Z`).getTime() - new Date(`${desdeDate}T12:00:00Z`).getTime();
    const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      setError('La fecha "Desde" no puede ser posterior a la fecha "Hasta"');
      return;
    }

    if (diffDias > 92) {
      setError('El rango máximo de consulta es de 92 días');
      return;
    }

    setCargando(true);
    setError(null);

    const desdeIso = inicioDelDia(desdeDate);
    const hastaIso = finDelDia(hastaDate);

    try {
      if (esOperario) {
        const respuesta = await apiConsultarHistorialPropio(token, desdeIso, hastaIso);
        setMarcaciones([...respuesta.marcaciones]);
        setJornadas([...respuesta.jornadas]);
      } else {
        const respuesta = await apiConsultarHistorialGeneral(token, {
          desde: desdeIso,
          hasta: hastaIso,
          conjuntoId: conjuntoIdFiltro || undefined,
          soloARevisar,
        });
        setMarcaciones([...respuesta.marcaciones]);
        setJornadas([...respuesta.jornadas]);
      }
    } catch (err) {
      if (err instanceof ErrorDeRed) {
        setError('El historial requiere conexión');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al consultar el historial');
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    consultarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enLinea, soloARevisar, conjuntoIdFiltro]);

  const nombreConjunto = (id: string): string => {
    const c = conjuntos.find((item) => item.id === id);
    return c ? c.nombre : id.slice(0, 8);
  };

  // Definición de columnas de la tabla de jornadas
  const columnasJornadas: Columna<Jornada>[] = [
    ...(!esOperario
      ? [
          {
            key: 'operarioId',
            encabezado: 'Operario',
            // TODO: El nombre del operario vendrá del módulo hojas-de-vida
            render: (j: Jornada) => <span title={j.operarioId}>{j.operarioId.slice(0, 8)}</span>,
          },
        ]
      : []),
    {
      key: 'entrada',
      encabezado: 'Entrada',
      render: (j: Jornada) => (j.entrada ? formatearFechaHora(j.entrada.registradaEnDispositivo) : 'Sin entrada'),
    },
    {
      key: 'salida',
      encabezado: 'Salida',
      render: (j: Jornada) => (j.salida ? formatearFechaHora(j.salida.registradaEnDispositivo) : 'Sin salida'),
    },
    {
      key: 'duracionMinutos',
      encabezado: 'Duración',
      render: (j: Jornada) => formatearDuracion(j.duracionMinutos),
    },
  ];

  // Definición de columnas de la tabla de marcaciones
  const columnasMarcaciones: Columna<Marcacion>[] = [
    ...(!esOperario
      ? [
          {
            key: 'operarioId',
            encabezado: 'Operario',
            // TODO: El nombre del operario vendrá del módulo hojas-de-vida
            render: (m: Marcacion) => <span title={m.operarioId}>{m.operarioId.slice(0, 8)}</span>,
          },
        ]
      : []),
    {
      key: 'conjuntoId',
      encabezado: 'Conjunto',
      render: (m: Marcacion) => nombreConjunto(m.conjuntoId),
    },
    {
      key: 'tipo',
      encabezado: 'Tipo',
      render: (m: Marcacion) => (m.tipo === 'entrada' ? 'Entrada' : 'Salida'),
    },
    {
      key: 'registradaEnDispositivo',
      encabezado: 'Hora dispositivo',
      render: (m: Marcacion) => formatearFechaHora(m.registradaEnDispositivo),
    },
    {
      key: 'estadoRevision',
      encabezado: 'Estado',
      render: (m: Marcacion) =>
        m.estadoRevision === 'a_revisar' ? (
          <span className="chip-revisar">A revisar</span>
        ) : (
          <span className="chip-normal">Normal</span>
        ),
    },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
        {esOperario ? 'Mi historial de asistencia' : 'Historial de asistencia'}
      </h2>

      {/* Formulario de filtros */}
      <div className="tarjeta">
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault();
            consultarHistorial();
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="campo">
              <label htmlFor="filtro-desde">Desde</label>
              <input
                id="filtro-desde"
                type="date"
                value={desdeDate}
                onChange={(e) => setDesdeDate(e.target.value)}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="filtro-hasta">Hasta</label>
              <input
                id="filtro-hasta"
                type="date"
                value={hastaDate}
                onChange={(e) => setHastaDate(e.target.value)}
                required
              />
            </div>
          </div>

          {!esOperario && (
            <>
              <div className="campo">
                <label htmlFor="filtro-conjunto">Conjunto residencial (opcional)</label>
                <select
                  id="filtro-conjunto"
                  value={conjuntoIdFiltro}
                  onChange={(e) => setConjuntoIdFiltro(e.target.value)}
                >
                  <option value="">-- Todos los conjuntos --</option>
                  {conjuntos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <input
                  id="filtro-solo-revisar"
                  type="checkbox"
                  checked={soloARevisar}
                  onChange={(e) => setSoloARevisar(e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />
                <label htmlFor="filtro-solo-revisar" style={{ cursor: 'pointer', fontWeight: 600 }}>
                  Solo marcaciones a revisar
                </label>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primario" disabled={cargando}>
            {cargando ? 'Buscando...' : 'Aplicar filtros'}
          </button>
        </form>
      </div>

      {/* Mensajes de error o estado */}
      {error && (
        <div className="alerta alerta-error" role="alert">
          {error}
        </div>
      )}

      {!enLinea && !error && (
        <div className="alerta alerta-aviso" role="alert">
          El historial requiere conexión
        </div>
      )}

      {/* Tabla de Jornadas calculadas (cuando no es solo a revisar) */}
      {!soloARevisar && (
        <div className="tarjeta" style={{ marginTop: '16px' }}>
          <h3 className="tarjeta-titulo">Jornadas calculadas</h3>
          <Tabla<Jornada>
            columnas={columnasJornadas}
            filas={jornadas}
            claveFila={(j: Jornada, i: number) => `${j.operarioId}-${i}`}
            mensajeVacio="No se encontraron jornadas en este período"
          />
        </div>
      )}

      {/* Tabla de marcaciones individuales */}
      <div className="tarjeta" style={{ marginTop: '16px' }}>
        <h3 className="tarjeta-titulo">Marcaciones individuales ({marcaciones.length})</h3>
        <Tabla<Marcacion>
          columnas={columnasMarcaciones}
          filas={marcaciones}
          claveFila={(m: Marcacion) => m.id}
          mensajeVacio="No hay marcaciones para los filtros seleccionados"
        />
      </div>
    </div>
  );
}
