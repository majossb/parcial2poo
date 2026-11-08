// Caso de uso: actualizar los datos de un operario (RF-03)
import { OperarioNoEncontradoError, type DatosOperario, type Operario } from '../../domain/operario.js';
import type { OperarioRepository } from '../ports/operario-repository.js';
import { OperarioDuplicadoError } from './registrar-operario.js';

export class ActualizarOperario {
  private readonly operarios: OperarioRepository;

  constructor(operarios: OperarioRepository) {
    this.operarios = operarios;
  }

  async ejecutar(id: string, datos: DatosOperario): Promise<Operario> {
    const operario = await this.operarios.buscarPorId(id);
    if (!operario) {
      throw new OperarioNoEncontradoError(id);
    }

    // Si cambia el documento, no puede quedar igual al de otro operario
    const otro = await this.operarios.buscarPorDocumento(datos.documentoIdentidad.trim());
    if (otro && otro.id !== id) {
      throw new OperarioDuplicadoError('Ya existe otro operario con ese documento');
    }

    operario.actualizar(datos);
    await this.operarios.guardar(operario);
    return operario;
  }
}