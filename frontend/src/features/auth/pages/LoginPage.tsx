// Página de inicio de sesión: maneja autenticación y redirección inicial según el rol
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ErrorDeRed } from '../../../shared/api/http-client.js';
import { useSesion } from '../hooks/useSesion.js';

export function LoginPage() {
  const { sesion, sesionVencida, iniciarSesion } = useSesion();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya tiene sesión activa y no está vencida, redirige a su pantalla inicial
  if (sesion && !sesionVencida) {
    const rutaInicial = sesion.usuario.rol === 'operario' ? '/marcar' : '/historial';
    return <Navigate to={rutaInicial} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo.trim() || !password) {
      setError('Por favor ingresa correo y contraseña');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const nuevaSesion = await iniciarSesion(correo.trim(), password);
      const destino = nuevaSesion.usuario.rol === 'operario' ? '/marcar' : '/historial';
      navigate(destino, { replace: true });
    } catch (err) {
      if (err instanceof ErrorDeRed) {
        setError('Necesitas conexión para iniciar sesión');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al iniciar sesión');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-contenedor">
      <header className="login-header">
        <h1>Mantenimiento de conjuntos</h1>
      </header>

      <main className="login-main">
        <div className="tarjeta">
          <h2 className="login-titulo texto-centrado">Iniciar sesión</h2>

          {sesionVencida && (
            <div className="alerta alerta-aviso" role="alert">
              Tu sesión ha vencido. Inicia sesión para continuar sincronizando tus marcaciones pendientes.
            </div>
          )}

          {error && (
            <div className="alerta alerta-error" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <form className="formulario" onSubmit={handleSubmit}>
            <div className="campo">
              <label htmlFor="correo">Correo electrónico</label>
              <input
                id="correo"
                type="email"
                autoComplete="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="ejemplo@empresa.local"
                required
                disabled={cargando}
              />
            </div>

            <div className="campo">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={cargando}
              />
            </div>

            <button type="submit" className="btn btn-primario btn-login" disabled={cargando}>
              {cargando ? 'Iniciando sesión...' : 'Entrar'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
