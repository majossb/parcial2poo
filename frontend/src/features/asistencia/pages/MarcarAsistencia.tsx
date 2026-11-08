// Pantalla principal del operario para marcar asistencia y sincronizar marcaciones locales (RF-06, RF-08)
import React from 'react';
import { BotonMarcar } from '../components/BotonMarcar.js';
import { ListaPendientes } from '../components/ListaPendientes.js';
import { useEstadoSync } from '../hooks/useEstadoSync.js';
import { useMarcacion } from '../hooks/useMarcacion.js';

export function MarcarAsistencia() {
  const {
    conjuntos,
    cargandoConjuntos,
    conjuntoSeleccionado,
    setConjuntoSeleccionado,
    tipoRecomendado,
    marcando,
    confirmacion,
    errorConjunto,
    marcar,
  } = useMarcacion();

  const {
    pendientes,
    rechazadas,
    sincronizando,
    ultimoResultado,
    sincronizarAhora,
    descartarRechazada,
  } = useEstadoSync();

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>Registro de Asistencia</h2>

      {/* Mensajes de confirmación de marcación inmediata */}
      {confirmacion && (
        <div className="alerta alerta-exito" role="status" aria-live="polite">
          <strong>✓ {confirmacion}</strong>
        </div>
      )}

      {/* Errores de selección de conjunto */}
      {errorConjunto && (
        <div className="alerta alerta-error" role="alert">
          {errorConjunto}
        </div>
      )}

      {/* Tarjeta de marcación */}
      <div className="tarjeta">
        {cargandoConjuntos ? (
          <p className="texto-muted">Cargando conjuntos residenciales...</p>
        ) : conjuntos.length === 0 ? (
          <div className="alerta alerta-aviso" role="alert">
            Conéctate una vez para cargar los conjuntos.
          </div>
        ) : (
          <div className="campo" style={{ marginBottom: '20px' }}>
            <label htmlFor="selector-conjunto">Conjunto residencial asignado</label>
            <select
              id="selector-conjunto"
              value={conjuntoSeleccionado}
              onChange={(e) => setConjuntoSeleccionado(e.target.value)}
              disabled={marcando}
              required
            >
              <option value="">-- Selecciona un conjunto --</option>
              {conjuntos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <BotonMarcar
          tipoRecomendado={tipoRecomendado}
          marcando={marcando}
          deshabilitado={conjuntos.length === 0 || !conjuntoSeleccionado}
          onMarcar={marcar}
        />
      </div>

      {/* Sección de sincronización manual */}
      <div className="tarjeta" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Sincronización</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-texto-muted)' }}>
              {pendientes > 0
                ? `${pendientes} marcación(es) por enviar al servidor`
                : 'Todas tus marcaciones están al día'}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secundario"
            onClick={sincronizarAhora}
            disabled={sincronizando}
            aria-label="Sincronizar marcaciones pendientes con el servidor"
            style={{ minHeight: '44px' }}
          >
            {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>

        {ultimoResultado && (
          <div
            className="alerta alerta-aviso"
            role="status"
            aria-live="polite"
            style={{ marginTop: '12px', marginBottom: 0, fontSize: '0.875rem' }}
          >
            {ultimoResultado}
          </div>
        )}
      </div>

      {/* Lista de marcaciones locales pendientes y rechazadas */}
      <ListaPendientes
        conjuntos={conjuntos}
        rechazadas={rechazadas}
        onDescartarRechazada={descartarRechazada}
      />
    </div>
  );
}
