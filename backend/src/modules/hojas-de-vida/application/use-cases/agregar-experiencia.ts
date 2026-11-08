// Caso de uso: agregar una experiencia laboral a la hoja de vida (RF-03)
import { ExperienciaLaboral, type DatosExperiencia } from '../../domain/hoja-de-vida.js';
import { OperarioNoEncontradoError } from '../../domain/operario.js';
import type { OperarioRepository } from '../ports/operario-repository.js';

export class AgregarExperiencia {
    private readonly operarios: OperarioRepository;

    constructor(operarios: OperarioRepository) {
    this.operarios = operarios;
    }

    async ejecutar(operarioId: string, datos: DatosExperiencia): Promise<ExperienciaLaboral> {
    const hojaDeVida = await this.operarios.buscarHojaDeVida(operarioId);
    if (!hojaDeVida) {
        throw new OperarioNoEncontradoError(operarioId);
    }
    const experiencia = ExperienciaLaboral.crear(operarioId, datos);
    hojaDeVida.agregarExperiencia(experiencia);
    await this.operarios.guardarExperiencia(experiencia);
    return experiencia;
    }
}