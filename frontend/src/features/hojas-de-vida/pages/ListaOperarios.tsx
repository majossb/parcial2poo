// Listado de operarios
// Pantalla con la lista de operarios: filtro de activos y cambio de estado (RF-04)
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabla, type Columna } from '../../../shared/components/Tabla.js';
import { useSesion } from '../../auth/hooks/useSesion.js';
import { apiCambiarEstadoOperario, apiListarOperarios } from '../api/hojas-de-vida.api.js';
import { mensajeDeError } from '../errores.js';
import type { Operario } from '../types.js';

export function ListaOperarios() {
  const { sesion } = useSesion();
  const token = sesion?.token;
  const rol = sesion?.usuario.rol;
  // Los supervisores solo consultan; administrativos y administrador pueden modificar
  const puedeEditar = rol === 'administrador' || rol === 'administrativo';

  const [operarios, setOperarios] = useState<Operario[]>([]);
  const [soloActivos, setSoloActivos] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cambiandoId, setCambiandoId] = useState<string | null>(null);

  const cargarOperarios = async () => {
    if (!token) return;
    setCargando(true);
    setError(null);
    try {
      setOperarios(await apiListarOperarios(token, soloActivos));
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo cargar la lista de operarios'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarOperarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, soloActivos]);

  const cambiarEstado = async (operario: Operario) => {
    if (!token) return;
    const accion = operario.activo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Deseas ${accion} a ${operario.nombreCompleto}?`)) return;

    setCambiandoId(operario.id);
    setError(null);
    try {
      const actualizado = await apiCambiarEstadoOperario(token, operario.id, !operario.activo);
      setOperarios((lista) =>
        soloActivos && !actualizado.activo
          ? lista.filter((o) => o.id !== actualizado.id)
          : lista.map((o) => (o.id === actualizado.id ? actualizado : o)),
      );
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo cambiar el estado del operario'));
    } finally {
      setCambiandoId(null);
    }
  };

  const columnas: Columna<Operario>[] = [
    {
      key: 'nombreCompleto',
      encabezado: 'Nombre',
      render: (o: Operario) => <Link to={`/operarios/${o.id}`}>{o.nombreCompleto}</Link>,
    },
    {
      key: 'documentoIdentidad',
      encabezado: 'Documento',
      render: (o: Operario) => o.documentoIdentidad,
    },
    {
      key: 'cargo',
      encabezado: 'Cargo',
      render: (o: Operario) => o.cargo,
    },
    {
      key: 'activo',
      encabezado: 'Estado',
      render: (o: Operario) =>
        o.activo ? (
          <span className="chip-normal">Activo</span>
        ) : (
          <span className="chip-revisar">Inactivo</span>
        ),
    },
    ...(puedeEditar
      ? [
          {
            key: 'id',
            encabezado: 'Acciones',
            render: (o: Operario) => (
              <button
                type="button"
                className="btn"
                onClick={() => cambiarEstado(o)}
                disabled={cambiandoId === o.id}
              >
                {cambiandoId === o.id ? 'Guardando...' : o.activo ? 'Desactivar' : 'Activar'}
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <h2 className="titulo-pagina">Operarios</h2>
        {puedeEditar && (
          <Link to="/operarios/nuevo" className="btn btn-primario">
            Registrar operario
          </Link>
        )}
      </div>

      <div className="tarjeta">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            id="filtro-solo-activos"
            type="checkbox"
            checked={soloActivos}
            onChange={(e) => setSoloActivos(e.target.checked)}
            style={{ width: '20px', height: '20px' }}
          />
          <label htmlFor="filtro-solo-activos" style={{ cursor: 'pointer', fontWeight: 600 }}>
            Mostrar solo operarios activos
          </label>
        </div>
      </div>

      {error && (
        <div className="alerta alerta-error" role="alert">
          {error}
        </div>
      )}

      <div className="tarjeta" style={{ marginTop: '16px' }}>
        <h3 className="tarjeta-titulo">
          {cargando ? 'Cargando...' : `Operarios registrados (${operarios.length})`}
        </h3>
        <Tabla<Operario>
          columnas={columnas}
          filas={operarios}
          claveFila={(o: Operario) => o.id}
          mensajeVacio="No hay operarios registrados"
        />
      </div>
    </div>
  );
}