// Caso de uso: listar operarios (RF-03)

import type { Operario } from '../../domain/operario.js';
import type { FiltroOperarios, OperarioRepository } from '../ports/operario-repository.js';

export class ListarOperarios {
    private readonly operarios: OperarioRepository;

    constructor(operarios: OperarioRepository) {
    this.operarios = operarios;
    }

    ejecutar(filtro: FiltroOperarios = {}): Promise<Operario[]> {
    return this.operarios.listar(filtro);
        }
}