// Error de aplicación con código HTTP. Lo usan los middlewares y controladores
// para señalar fallos esperados (401, 403, 404...) sin mezclar HTTP con el dominio.
export class AppError extends Error {
  readonly estado: number;

  constructor(estado: number, mensaje: string) {
    super(mensaje);
    this.name = 'AppError';
    this.estado = estado;
  }
}