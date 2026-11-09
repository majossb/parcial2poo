// Adaptador de salida: crea la cuenta del operario pidiéndosela al módulo auth.
// Así hojas-de-vida no toca la tabla usuarios, que es de auth.
import type { CuentasUsuario } from '../../application/ports/cuentas-usuario.js';

// Lo mínimo que este adaptador necesita de auth (lo cumple su caso de uso CrearUsuario)
export interface CreadorDeUsuarios {
  ejecutar(solicitud: { correo: string; password: string; rol: string }): Promise<{ id: string }>;
}

export class CuentasDesdeAuth implements CuentasUsuario {
  private readonly creador: CreadorDeUsuarios;

  constructor(creador: CreadorDeUsuarios) {
    this.creador = creador;
  }

  async crearCuentaOperario(correo: string, contrasenaInicial: string): Promise<string> {
    const usuario = await this.creador.ejecutar({
      correo,
      password: contrasenaInicial,
      rol: 'operario',
    });
    return usuario.id;
  }
}