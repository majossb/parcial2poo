// Caso de uso: agregar estudios, cursos o certificaciones a la hoja de vida (RF-03)
import { Formacion, type DatosFormacion } from '../../domain/hoja-de-vida.js';
import { OperarioNoEncontradoError } from '../../domain/operario.js';
import type { OperarioRepository } from '../ports/operario-repository.js';

export class AgregarFormacion {
  private readonly operarios: OperarioRepository;

  constructor(operarios: OperarioRepository) {
    this.operarios = operarios;
  }

  async ejecutar(operarioId: string, datos: DatosFormacion): Promise<Formacion> {
    const hojaDeVida = await this.operarios.buscarHojaDeVida(operarioId);
    if (!hojaDeVida) {
      throw new OperarioNoEncontradoError(operarioId);
    }
    const formacion = Formacion.crear(operarioId, datos);
    hojaDeVida.agregarFormacion(formacion);
    await this.operarios.guardarFormacion(formacion);
    return formacion;
  }
}