// API de hojas de vida: llamadas HTTP para operarios y su experiencia laboral (RF-02 a RF-05)
import { request } from '../../../shared/api/http-client.js';
import type {
    DatosExperiencia,
    DatosOperario,
    ExperienciaLaboral,
    HojaDeVida,
    Operario,
    SolicitudRegistroOperario,
} from '../types.js';

const BASE = '/api/hojas-de-vida/operarios';

export async function apiListarOperarios(token: string, soloActivos = false): Promise<Operario[]> {
    const ruta = soloActivos ? `${BASE}?soloActivos=true` : BASE;
    const respuesta = await request<{ operarios: Operario[] }>(ruta, { method: 'GET', token });
    return respuesta.operarios || [];
}

export function apiConsultarHojaDeVida(token: string, id: string): Promise<HojaDeVida> {
    return request<HojaDeVida>(`${BASE}/${encodeURIComponent(id)}`, { method: 'GET', token });
}

export function apiRegistrarOperario(token: string, datos: SolicitudRegistroOperario): Promise<Operario> {
    return request<Operario>(BASE, { method: 'POST', token, body: datos });
}

export function apiActualizarOperario(token: string, id: string, datos: DatosOperario): Promise<Operario> {
    return request<Operario>(`${BASE}/${encodeURIComponent(id)}`, { method: 'PUT', token, body: datos });
}

export function apiCambiarEstadoOperario(token: string, id: string, activo: boolean): Promise<Operario> {
    return request<Operario>(`${BASE}/${encodeURIComponent(id)}/estado`, {
    method: 'PATCH',
    token,
    body: { activo },
    });
}

export function apiAgregarExperiencia(
    token: string,
    id: string,
    datos: DatosExperiencia,
): Promise<ExperienciaLaboral> {
    return request<ExperienciaLaboral>(`${BASE}/${encodeURIComponent(id)}/experiencias`, {
    method: 'POST',
    token,
    body: datos,
    });
}