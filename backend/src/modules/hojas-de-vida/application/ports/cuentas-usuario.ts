// Puerto: crear la cuenta de acceso del operario sin conocer el módulo auth por dentro
export class CuentaInvalidaError extends Error {
    constructor(mensaje: string) {
    super(mensaje);
    this.name = 'CuentaInvalidaError';
    }
}

export interface CuentasUsuario {
  // Crea un usuario con rol operario y devuelve su id. Falla si el correo ya está registrado.
    crearCuentaOperario(correo: string, contrasenaInicial: string): Promise<string>;
}