// Componente Layout principal: estructura de cabecera, indicador de conexión, datos de usuario y navegación por rol
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSesion } from '../../features/auth/hooks/useSesion.js';
import { colaMarcaciones } from '../../offline/cola-marcaciones.js';
import { IndicadorConexion } from './IndicadorConexion.js';

export function Layout() {
  const { sesion, cerrarSesion } = useSesion();
  const navigate = useNavigate();

  const handleCerrarSesion = async () => {
    if (sesion?.usuario?.id) {
      try {
        const pendientes = await colaMarcaciones.contar(sesion.usuario.id);
        if (pendientes > 0) {
          const confirmar = window.confirm(
            `Tienes ${pendientes} marcaciones sin enviar; se conservarán en este celular y se enviarán cuando inicies sesión de nuevo.\n\n¿Deseas cerrar sesión?`,
          );
          if (!confirmar) return;
        }
      } catch {
        // En caso de fallo de lectura, continuamos con el cierre
      }
    }

    await cerrarSesion();
    navigate('/login', { replace: true });
  };

  const rol = sesion?.usuario.rol;
  const esOperario = rol === 'operario';

  return (
    <div className="layout-contenedor">
      <header className="layout-header">
        <div className="header-superior">
          <span className="header-titulo">Mantenimiento</span>
          <IndicadorConexion />
        </div>

        {sesion && (
          <div className="header-usuario">
            <div>
              <strong>{sesion.usuario.correo}</strong>{' '}
              <span style={{ textTransform: 'capitalize' }}>({rol})</span>
            </div>
            <button
              type="button"
              className="btn-cerrar-sesion"
              onClick={handleCerrarSesion}
              aria-label="Cerrar sesión"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </header>

      {sesion && (
        <nav className="layout-nav" aria-label="Navegación principal">
          {esOperario ? (
            <>
              <NavLink
                to="/marcar"
                className={({ isActive }) => `nav-link ${isActive ? 'activo' : ''}`}
              >
                Marcar asistencia
              </NavLink>
              <NavLink
                to="/historial"
                className={({ isActive }) => `nav-link ${isActive ? 'activo' : ''}`}
              >
                Mi historial
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/historial"
                className={({ isActive }) => `nav-link ${isActive ? 'activo' : ''}`}
              >
                Asistencia
              </NavLink>
              <NavLink
                to="/operarios"
                className={({ isActive }) => `nav-link ${isActive ? 'activo' : ''}`}
              >
                Operarios
              </NavLink>
            </>
          )}
        </nav>
      )}

      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}