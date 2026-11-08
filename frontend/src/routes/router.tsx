// Enrutador de la aplicación con React Router 7 y control de navegación según el rol
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { HistorialAsistencia } from '../features/asistencia/pages/HistorialAsistencia.js';
import { MarcarAsistencia } from '../features/asistencia/pages/MarcarAsistencia.js';
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
        path: '*',
        element: <RedireccionInicial />,
      },
    ],
  },
]);
