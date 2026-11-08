// Caso de uso: activar o desactivar un operario (RF-04)
import { OperarioNoEncontradoError, type Operario } from '../../domain/operario.js';
import type { OperarioRepository } from '../ports/operario-repository.js';

export class CambiarEstadoOperario {
  private readonly operarios: OperarioRepository;

  constructor(operarios: OperarioRepository) {
    this.operarios = operarios;
  }

  async ejecutar(id: string, activo: boolean): Promise<Operario> {
    const operario = await this.operarios.buscarPorId(id);
    if (!operario) {
      throw new OperarioNoEncontradoError(id);
    }
    if (activo) {
      operario.activar();
    } else {
      operario.desactivar();
    }
    await this.operarios.guardar(operario);
    return operario;
  }
}