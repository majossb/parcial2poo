// Puerto: consultar si un operario está activo
export interface OperarioResumen {
  readonly id: string;
  readonly activo: boolean;
}

export interface OperariosGateway {
  buscarPorId(operarioId: string): Promise<OperarioResumen | null>;
  // Más adelante, para la parte HTTP, se agregará buscarPorUsuarioId(usuarioId).
}