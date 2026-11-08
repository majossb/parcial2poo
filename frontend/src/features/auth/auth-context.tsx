// Contexto de autenticación: gestiona la sesión en localStorage y memoria tolerando fallos y modo sin conexión
import React, { createContext, useCallback, useEffect, useState } from 'react';
import { suscribirSesionVencida } from '../../shared/api/http-client.js';
import { apiLogin, apiLogout } from './api/auth.api.js';
import type { Sesion } from './types.js';

export interface AuthContextValor {
  readonly sesion: Sesion | null;
  readonly sesionVencida: boolean;
  iniciarSesion(correo: string, password: string): Promise<Sesion>;
  cerrarSesion(): Promise<void>;
  marcarSesionVencida(): void;
}

export const AuthContext = createContext<AuthContextValor | null>(null);

const CLAVE_STORAGE = 'sesion-mantenimiento';

function leerSesionAlmacenada(): Sesion | null {
  try {
    const json = localStorage.getItem(CLAVE_STORAGE);
    if (!json) return null;
    const datos = JSON.parse(json) as Sesion;
    if (datos && datos.token && datos.usuario) {
      return datos;
    }
    return null;
  } catch {
    return null;
  }
}

function guardarSesionEnStorage(sesion: Sesion | null): void {
  try {
    if (sesion) {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(sesion));
    } else {
      localStorage.removeItem(CLAVE_STORAGE);
    }
  } catch {
    // Si localStorage está deshabilitado o lleno, la sesión permanece en memoria
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(leerSesionAlmacenada);
  const [sesionVencida, setSesionVencida] = useState<boolean>(false);

  // Escuchar avisos de 401 del cliente HTTP
  useEffect(() => {
    const desuscribir = suscribirSesionVencida(() => {
      setSesionVencida(true);
    });
    return desuscribir;
  }, []);

  const iniciarSesion = useCallback(async (correo: string, password: string): Promise<Sesion> => {
    const res = await apiLogin(correo, password);
    const nuevaSesion: Sesion = {
      token: res.token,
      usuario: res.usuario,
    };
    guardarSesionEnStorage(nuevaSesion);
    setSesion(nuevaSesion);
    setSesionVencida(false);
    return nuevaSesion;
  }, []);

  const cerrarSesion = useCallback(async (): Promise<void> => {
    const tokenActual = sesion?.token;
    if (tokenActual) {
      try {
        await apiLogout(tokenActual);
      } catch {
        // Si no hay red o el token ya expiró, continuamos cerrando localmente
      }
    }
    guardarSesionEnStorage(null);
    setSesion(null);
    setSesionVencida(false);
  }, [sesion]);

  const marcarSesionVencida = useCallback(() => {
    setSesionVencida(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        sesion,
        sesionVencida,
        iniciarSesion,
        cerrarSesion,
        marcarSesionVencida,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
