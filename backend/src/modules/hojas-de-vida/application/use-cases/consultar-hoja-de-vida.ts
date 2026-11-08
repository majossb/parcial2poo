// Caso de uso: consultar la hoja de vida completa de un operario (RF-05)
import type { HojaDeVida } from '../../domain/hoja-de-vida.js';
import { OperarioNoEncontradoError } from '../../domain/operario.js';
import type { OperarioRepository } from '../ports/operario-repository.js';

export class ConsultarHojaDeVida {
  private readonly operarios: OperarioRepository;

  constructor(operarios: OperarioRepository) {
    this.operarios = operarios;
  }

  async ejecutar(operarioId: string): Promise<HojaDeVida> {
    const hojaDeVida = await this.operarios.buscarHojaDeVida(operarioId);
    if (!hojaDeVida) {
      throw new OperarioNoEncontradoError(operarioId);
    }
    return hojaDeVida;
  }
}