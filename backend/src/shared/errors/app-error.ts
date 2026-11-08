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

// Cada módulo sabe qué errores de su dominio significan qué código HTTP, y los
// entrega como "traductores". Así el manejador compartido no depende de ningún módulo.
export interface ErrorTraducido {
  readonly estado: number;
  readonly mensaje: string;
}
export type TraductorDeErrores = (error: unknown) => ErrorTraducido | null;