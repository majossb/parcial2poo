// Convierte un error de la API en un mensaje entendible para el usuario
import { ErrorDeRed } from '../../shared/api/http-client.js';

export function mensajeDeError(error: unknown, porDefecto: string): string {
  if (error instanceof ErrorDeRed) return 'Esta sección requiere conexión a internet';
  if (error instanceof Error) return error.message;
  return porDefecto;
}