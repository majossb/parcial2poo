// Caso de uso: registrar entrada o salida (RF-06)
import {
  crearMarcacion,
  MarcacionInvalidaError,
  validarDatosMarcacion,
} from '../../domain/marcacion.js';
import type { EstadoRevision } from '../../domain/marcacion.js';
import type { MarcacionRepository } from '../ports/marcacion-repository.js';
import type { OperariosGateway } from '../ports/operarios-gateway.js';
import type { Reloj } from '../ports/reloj.js';

export interface SolicitudMarcacion {
  id: string;
  operarioId: string;
  conjuntoId: string;
  tipo: string;
  registradaEnDispositivo: string; // fecha ISO enviada por el celular
}

export type ResultadoRegistro =
  | { resultado: 'creada'; estadoRevision: EstadoRevision; motivos: string[] }
  | { resultado: 'duplicada' }
  | { resultado: 'rechazada'; motivo: string };

export class RegistrarMarcacion {
  private readonly marcaciones: MarcacionRepository;
  private readonly operarios: OperariosGateway;
  private readonly reloj: Reloj;

  constructor(marcaciones: MarcacionRepository, operarios: OperariosGateway, reloj: Reloj) {
    this.marcaciones = marcaciones;
    this.operarios = operarios;
    this.reloj = reloj;
  }

  async ejecutar(s: SolicitudMarcacion): Promise<ResultadoRegistro> {
    const recibida = this.reloj.ahora();
    const registrada = new Date(s.registradaEnDispositivo);
    const datos = {
      id: s.id,
      operarioId: s.operarioId,
      conjuntoId: s.conjuntoId,
      tipo: s.tipo,
      registradaEnDispositivo: registrada,
    };

    try {
      validarDatosMarcacion(datos);
    } catch (e) {
      if (e instanceof MarcacionInvalidaError) return { resultado: 'rechazada', motivo: e.message };
      throw e;
    }

    const operario = await this.operarios.buscarPorId(s.operarioId);
    if (!operario) return { resultado: 'rechazada', motivo: 'El operario no existe' };

    // La marcaciÃ³n ocurriÃ³ en la vida real aunque el operario se haya desactivado
    // mientras estaba sin conexiÃ³n: se guarda y se marca para revisiÃ³n.
    const motivosExternos = operario.activo ? [] : ['El operario estaba desactivado'];

    const anterior = await this.marcaciones.buscarUltimaAntesDe(s.operarioId, registrada);
    const { marcacion, motivos } = crearMarcacion(datos, anterior, recibida, motivosExternos);

    const guardada = await this.marcaciones.guardar(marcacion);
    if (!guardada) return { resultado: 'duplicada' };
    return { resultado: 'creada', estadoRevision: marcacion.estadoRevision, motivos };
  }
}