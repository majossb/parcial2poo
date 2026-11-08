// Prueba de regresión: el hook useEstadoSync no debe disparar sincronizaciones en bucle infinito
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, act } from '@testing-library/react';
import { AuthContext, type AuthContextValor } from '../src/features/auth/auth-context.js';
import { useEstadoSync } from '../src/features/asistencia/hooks/useEstadoSync.js';
import { sincronizadorGlobal } from '../src/offline/sincronizador.js';
import type { ResultadoSincronizacion } from '../src/offline/sincronizador.js';

// Mock del sincronizador global para contar cuántas veces se llama
const sincronizarSpy = vi.spyOn(sincronizadorGlobal, 'sincronizar');

const resultadoNadaQueEnviar: ResultadoSincronizacion = {
  tipo: 'nada_que_enviar',
  mensaje: 'No hay marcaciones pendientes por enviar',
  enviadas: 0,
  duplicadas: 0,
  rechazadas: 0,
  paraRevision: 0,
};

// Componente auxiliar que consume el hook para poder probarlo
function ComponentePrueba({ onEstado }: { onEstado: (e: ReturnType<typeof useEstadoSync>) => void }) {
  const estado = useEstadoSync();
  // Reportar el estado al test sin causar re-renders adicionales
  React.useEffect(() => {
    onEstado(estado);
  });
  return null;
}

function renderConSesionOperario(onEstado: (e: ReturnType<typeof useEstadoSync>) => void) {
  const valor: AuthContextValor = {
    sesion: {
      token: 'token-test',
      usuario: { id: 'operario-1', correo: 'op@test.com', rol: 'operario', activo: true },
    },
    sesionVencida: false,
    iniciarSesion: vi.fn(),
    cerrarSesion: vi.fn(),
    marcarSesionVencida: vi.fn(),
  };

  return render(
    React.createElement(
      AuthContext.Provider,
      { value: valor },
      React.createElement(ComponentePrueba, { onEstado }),
    ),
  );
}

describe('Regresión: useEstadoSync no entra en bucle infinito', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sincronizarSpy.mockResolvedValue(resultadoNadaQueEnviar);
  });

  afterEach(() => {
    vi.useRealTimers();
    sincronizarSpy.mockRestore();
  });

  it('sincronizar se llama como máximo 1 vez en los primeros 600 ms tras montar (operario)', async () => {
    let ultimoEstado: ReturnType<typeof useEstadoSync> | null = null;

    await act(async () => {
      renderConSesionOperario((e) => { ultimoEstado = e; });
    });

    // Avanzar 600 ms simulados para dar tiempo a posibles re-ejecuciones
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // Con el bug original, sincronizar se llamaría decenas o cientos de veces.
    // Con el arreglo, como máximo 1 vez (la sincronización inicial al montar).
    expect(sincronizarSpy.mock.calls.length).toBeLessThanOrEqual(1);
    // Verificar que el hook dejó de mostrar "sincronizando"
    expect(ultimoEstado).not.toBeNull();
    expect(ultimoEstado!.sincronizando).toBe(false);
  });

  it('la sincronización automática al montar NO muestra "nada_que_enviar" como resultado', async () => {
    let ultimoEstado: ReturnType<typeof useEstadoSync> | null = null;

    await act(async () => {
      renderConSesionOperario((e) => { ultimoEstado = e; });
    });

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // El mensaje de "nada_que_enviar" solo debe aparecer en sincronizaciones manuales
    expect(ultimoEstado!.ultimoResultado).toBeNull();
  });
});
