// Puerto: lo que el módulo necesita para guardar y consultar operarios (RF-02 a RF-05)
import type { Operario } from '../../domain/operario.js';
import type { ExperienciaLaboral, Formacion, HojaDeVida } from '../../domain/hoja-de-vida.js';

export interface FiltroOperarios {
  soloActivos?: boolean;
}

export interface OperarioRepository {
  // Crea el operario si no existe o lo actualiza si ya existe
  guardar(operario: Operario): Promise<void>;
  buscarPorId(id: string): Promise<Operario | null>;
  buscarPorDocumento(documentoIdentidad: string): Promise<Operario | null>;
  buscarPorUsuarioId(usuarioId: string): Promise<Operario | null>;
  listar(filtro?: FiltroOperarios): Promise<Operario[]>;
  // El operario junto con su experiencia laboral y su formación
  buscarHojaDeVida(operarioId: string): Promise<HojaDeVida | null>;
  guardarExperiencia(experiencia: ExperienciaLaboral): Promise<void>;
  guardarFormacion(formacion: Formacion): Promise<void>;
}