// Punto de entrada de la aplicación: inicialización de React, estilos globales y registro del Service Worker
import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App.js';
import './styles/global.css';

// Registro automático del Service Worker para la PWA
registerSW({
  immediate: true,
  onNeedRefresh() {
    // Si hay nueva versión lista, se actualiza automáticamente al recargar
  },
  onOfflineReady() {
    // La aplicación está lista para funcionar sin conexión
  },
});

const contenedor = document.getElementById('root');
if (!contenedor) {
  throw new Error('No se encontró el elemento raíz #root en el documento');
}

ReactDOM.createRoot(contenedor).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
