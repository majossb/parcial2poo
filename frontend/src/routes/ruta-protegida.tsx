// Guardia de ruta protegida: verifica sesión activa y control de acceso basado en roles permitidos
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSesion } from '../features/auth/hooks/useSesion.js';
import type { Rol } from '../features/auth/types.js';

export interface RutaProtegidaProps {
  rolesPermitidos?: readonly Rol[];
  children?: React.ReactNode;
}

export function RutaProtegida({ rolesPermitidos, children }: RutaProtegidaProps) {
  const { sesion } = useSesion();

  if (!sesion) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(sesion.usuario.rol)) {
    return (
      <div className="alerta alerta-error texto-centrado" role="alert">
        <h2>Acceso denegado</h2>
        <p>No tienes permiso para ver esta página.</p>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
