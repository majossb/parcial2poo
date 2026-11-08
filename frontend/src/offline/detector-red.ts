// Detector de estado de red: combina eventos del navegador y resultados reales de peticiones HTTP
import { useEffect, useState } from 'react';

type ListenerRed = (enLinea: boolean) => void;
const listenersRed: Set<ListenerRed> = new Set();

let estadoEnLinea = typeof navigator !== 'undefined' ? navigator.onLine : true;

export function obtenerEstaEnLinea(): boolean {
  return estadoEnLinea;
}

export function reportarEstadoRed(enLinea: boolean): void {
  if (estadoEnLinea !== enLinea) {
    estadoEnLinea = enLinea;
    listenersRed.forEach((cb) => {
      try {
        cb(estadoEnLinea);
      } catch {
        // Ignorar fallos de oyentes
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    reportarEstadoRed(true);
  });

  window.addEventListener('offline', () => {
    reportarEstadoRed(false);
  });
}

export function useEstaEnLinea(): boolean {
  const [enLinea, setEnLinea] = useState<boolean>(estadoEnLinea);

  useEffect(() => {
    const listener = (nuevoEstado: boolean) => setEnLinea(nuevoEstado);
    listenersRed.add(listener);
    setEnLinea(estadoEnLinea);

    return () => {
      listenersRed.delete(listener);
    };
  }, []);

  return enLinea;
}
