// Enrutador de la aplicación con React Router 7 y control de navegación según el rol
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { HistorialAsistencia } from '../features/asistencia/pages/HistorialAsistencia.js';
import { MarcarAsistencia } from '../features/asistencia/pages/MarcarAsistencia.js';
import { ListaOperarios } from '../features/hojas-de-vida/pages/ListaOperarios.js';
import { FormularioOperario } from '../features/hojas-de-vida/pages/FormularioOperario.js';
import { DetalleOperario } from '../features/hojas-de-vida/pages/DetalleOperario.js';
import type { Rol } from '../features/auth/types.js';
import { useSesion } from '../features/auth/hooks/useSesion.js';
import { LoginPage } from '../features/auth/pages/LoginPage.js';
import { Layout } from '../shared/components/Layout.js';
import { RutaProtegida } from './ruta-protegida.js';

function RedireccionInicial() {
  const { sesion } = useSesion();
  if (!sesion) return <Navigate to="/login" replace />;
  return <Navigate to={sesion.usuario.rol === 'operario' ? '/marcar' : '/historial'} replace />;
}

function GuardiaOperarioMarcar() {
  const { sesion } = useSesion();
  if (sesion && sesion.usuario.rol !== 'operario') {
    return <Navigate to="/historial" replace />;
  }
  return <MarcarAsistencia />;
}

// Deja pasar solo a los roles indicados; a los demás los manda al inicio
function SoloRoles({ roles, children }: { roles: Rol[]; children: React.ReactElement }) {
  const { sesion } = useSesion();
  if (sesion && !roles.includes(sesion.usuario.rol)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <RutaProtegida>
        <Layout />
      </RutaProtegida>
    ),
    children: [
      {
        index: true,
        element: <RedireccionInicial />,
      },
      {
        path: 'marcar',
        element: <GuardiaOperarioMarcar />,
      },
      {
        path: 'historial',
        element: <HistorialAsistencia />,
      },
      {
        path: 'operarios',
        element: (
          <SoloRoles roles={['administrador', 'administrativo', 'supervisor']}>
            <ListaOperarios />
          </SoloRoles>
        ),
      },
      {
        path: 'operarios/nuevo',
        element: (
          <SoloRoles roles={['administrador', 'administrativo']}>
            <FormularioOperario />
          </SoloRoles>
        ),
      },
      {
        path: 'operarios/:id',
        element: (
          <SoloRoles roles={['administrador', 'administrativo', 'supervisor']}>
            <DetalleOperario />
          </SoloRoles>
        ),
      },
      {
        path: 'operarios/:id/editar',
        element: (
          <SoloRoles roles={['administrador', 'administrativo']}>
            <FormularioOperario />
          </SoloRoles>
        ),
      },
      {
        path: '*',
        element: <RedireccionInicial />,
      },
    ],
  },
]);