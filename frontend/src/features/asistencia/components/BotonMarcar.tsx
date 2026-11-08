// Componente botón de marcación rápida: acción principal destacada y botón secundario alternativo (RF-06)
import React from 'react';
import type { TipoMarcacion } from '../types.js';

export interface BotonMarcarProps {
  readonly tipoRecomendado: TipoMarcacion;
  readonly marcando: boolean;
  readonly deshabilitado?: boolean;
  readonly onMarcar: (tipo: TipoMarcacion) => void;
}

export function BotonMarcar({
  tipoRecomendado,
  marcando,
  deshabilitado = false,
  onMarcar,
}: BotonMarcarProps) {
  const tipoContrario: TipoMarcacion = tipoRecomendado === 'entrada' ? 'salida' : 'entrada';

  const textoPrincipal = tipoRecomendado === 'entrada' ? 'Marcar Entrada' : 'Marcar Salida';
  const textoSecundario = tipoContrario === 'entrada' ? 'Marcar Entrada de todas formas' : 'Marcar Salida de todas formas';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      <button
        type="button"
        className="btn btn-primario btn-marcar-grande"
        onClick={() => onMarcar(tipoRecomendado)}
        disabled={deshabilitado || marcando}
        aria-label={textoPrincipal}
      >
        {marcando ? 'Registrando...' : textoPrincipal}
      </button>

      <button
        type="button"
        className="btn btn-secundario"
        onClick={() => onMarcar(tipoContrario)}
        disabled={deshabilitado || marcando}
        aria-label={textoSecundario}
        style={{ fontSize: '0.9rem' }}
      >
        {textoSecundario}
      </button>
    </div>
  );
}
