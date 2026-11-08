// Puerto: consultar operarios (los datos viven en el módulo hojas-de-vida)
export interface OperarioResumen {
  readonly id: string;
  readonly activo: boolean;
}

export interface OperariosGateway {
  buscarPorId(operarioId: string): Promise<OperarioResumen | null>;
  // Para saber qué operario es el dueño del token (RF-06, RF-08).
  buscarPorUsuarioId(usuarioId: string): Promise<OperarioResumen | null>;
}