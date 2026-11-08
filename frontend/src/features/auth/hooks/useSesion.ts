// Hook personalizado para acceder a los datos de la sesión y funciones de autenticación
import { useContext } from 'react';
import { AuthContext, type AuthContextValor } from '../auth-context.js';

export function useSesion(): AuthContextValor {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useSesion debe usarse dentro de un AuthProvider');
  }
  return contexto;
}
