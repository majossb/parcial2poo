// Componente raíz de la aplicación: encapsula el proveedor de autenticación y el enrutador
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './features/auth/auth-context.js';
import { router } from './routes/router.js';

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
