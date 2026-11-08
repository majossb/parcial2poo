// Caso de uso: saber qué operario corresponde al usuario del token (RF-06, RF-08)
import type { OperarioResumen, OperariosGateway } from '../ports/operarios-gateway.js';

export class OperarioNoEncontradoError extends Error {
  constructor(mensaje = 'Tu usuario no tiene una hoja de vida de operario') {
    super(mensaje);
    this.name = 'OperarioNoEncontradoError';
  }
}

export class ResolverOperarioDelUsuario {
  private readonly operarios: OperariosGateway;

  constructor(operarios: OperariosGateway) {
    this.operarios = operarios;
  }

  async ejecutar(usuarioId: string): Promise<OperarioResumen> {
    const operario = await this.operarios.buscarPorUsuarioId(usuarioId);
    if (!operario) throw new OperarioNoEncontradoError();
    return operario;
  }
}