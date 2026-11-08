// Caso de uso: registrar un operario nuevo junto con su cuenta de acceso (RF-02)
import { Operario, type DatosOperario } from '../../domain/operario.js';
import type { CuentasUsuario } from '../ports/cuentas-usuario.js';
import type { OperarioRepository } from '../ports/operario-repository.js';

export class OperarioDuplicadoError extends Error {
    constructor(mensaje: string) {
    super(mensaje);
    this.name = 'OperarioDuplicadoError';
    }
}

export interface SolicitudRegistroOperario extends DatosOperario {
    correo: string;
    contrasenaInicial: string;
}

export class RegistrarOperario {
    private readonly operarios: OperarioRepository;
    private readonly cuentas: CuentasUsuario;

  constructor(operarios: OperarioRepository, cuentas: CuentasUsuario) {
    this.operarios = operarios;
    this.cuentas = cuentas;
    }

  async ejecutar(solicitud: SolicitudRegistroOperario): Promise<Operario> {
    const { correo, contrasenaInicial, ...datos } = solicitud;

    // 1. Revisar todo antes de crear nada
    Operario.validar(datos);
    const existente = await this.operarios.buscarPorDocumento(datos.documentoIdentidad.trim());
    if (existente) {
      throw new OperarioDuplicadoError('Ya existe un operario con ese documento');
    }

    // 2. Crear la cuenta de acceso y luego el operario ligado a ella
    const usuarioId = await this.cuentas.crearCuentaOperario(correo, contrasenaInicial);
    const operario = Operario.crear(usuarioId, datos);
    await this.operarios.guardar(operario);
    return operario;
  }
}