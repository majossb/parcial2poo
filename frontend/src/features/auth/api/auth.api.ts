// API de autenticación: llamadas HTTP a los endpoints de login y logout del backend
import { request } from '../../../shared/api/http-client.js';
import type { RespuestaLogin } from '../types.js';

export async function apiLogin(correo: string, password: string): Promise<RespuestaLogin> {
  return request<RespuestaLogin>('/api/auth/login', {
    method: 'POST',
    body: { correo, password },
  });
}

export async function apiLogout(token: string): Promise<void> {
  return request<void>('/api/auth/logout', {
    method: 'POST',
    token,
  });
}
