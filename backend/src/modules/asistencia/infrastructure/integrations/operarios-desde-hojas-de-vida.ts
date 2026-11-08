// Adaptador: asistencia obtiene los operarios del módulo hojas-de-vida.
//
// CONTRATO con hojas-de-vida: ese módulo debe exportar desde su index.ts algo que cumpla
// `BuscadorDeOperarios`. Asistencia nunca consulta la tabla `operarios` por su cuenta.
import type {
  OperarioResumen,
  OperariosGateway,
} from '../../application/ports/operarios-gateway.js';

export interface BuscadorDeOperarios {
  buscarPorId(operarioId: string): Promise<{ id: string; activo: boolean } | null>;
  buscarPorUsuarioId(usuarioId: string): Promise<{ id: string; activo: boolean } | null>;
}

export class OperariosDesdeHojasDeVida implements OperariosGateway {
  private readonly buscador: BuscadorDeOperarios;

  constructor(buscador: BuscadorDeOperarios) {
    this.buscador = buscador;
  }

  async buscarPorId(operarioId: string): Promise<OperarioResumen | null> {
    const o = await this.buscador.buscarPorId(operarioId);
    return o ? { id: o.id, activo: o.activo } : null;
  }

  async buscarPorUsuarioId(usuarioId: string): Promise<OperarioResumen | null> {
    const o = await this.buscador.buscarPorUsuarioId(usuarioId);
    return o ? { id: o.id, activo: o.activo } : null;
  }
}
