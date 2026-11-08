// Caso de uso: listar los conjuntos activos (el celular los guarda para elegir sin conexión)
import type { Conjunto } from '../../domain/conjunto.js';
import type { ConjuntoRepository } from '../ports/conjunto-repository.js';

export class ListarConjuntos {
  private readonly conjuntos: ConjuntoRepository;

  constructor(conjuntos: ConjuntoRepository) {
    this.conjuntos = conjuntos;
  }

  ejecutar(): Promise<Conjunto[]> {
    return this.conjuntos.listarActivos();
  }
}