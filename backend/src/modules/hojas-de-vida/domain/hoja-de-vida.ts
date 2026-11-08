// Hoja de vida: un operario junto con su experiencia laboral (RF-03)
import { randomUUID } from 'node:crypto';
import { Operario } from './operario.js';

export class ExperienciaInvalidaError extends Error {
    constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ExperienciaInvalidaError';
    } 
}

export interface DatosExperiencia {
    empresa: string;
    cargo: string;
    fechaInicio: Date;
  fechaFin: Date | null; // null = todavía trabaja allí
    descripcion: string | null;
}

export class ExperienciaLaboral {
    readonly id: string;
    readonly operarioId: string;
    private readonly _datos: DatosExperiencia;

    private constructor(id: string, operarioId: string, datos: DatosExperiencia) {
    this.id = id;
    this.operarioId = operarioId;
    this._datos = datos;
    }

    static crear(operarioId: string, datos: DatosExperiencia): ExperienciaLaboral {
    ExperienciaLaboral.validar(datos);
    const descripcion = datos.descripcion?.trim() || null;
    return new ExperienciaLaboral(randomUUID(), operarioId, {
        ...datos,
        empresa: datos.empresa.trim(),
        cargo: datos.cargo.trim(),
        descripcion,
    });
    }

    static reconstruir(id: string, operarioId: string, datos: DatosExperiencia): ExperienciaLaboral {
    return new ExperienciaLaboral(id, operarioId, datos);
    }

    get datos(): Readonly<DatosExperiencia> {
    return { ...this._datos };
    }

    private static validar(datos: DatosExperiencia): void {
    if (!datos.empresa || datos.empresa.trim() === '') {
        throw new ExperienciaInvalidaError('La empresa es obligatoria');
    }
    if (!datos.cargo || datos.cargo.trim() === '') {
        throw new ExperienciaInvalidaError('El cargo es obligatorio');
    }
    if (Number.isNaN(datos.fechaInicio.getTime())) {
        throw new ExperienciaInvalidaError('La fecha de inicio no es válida');
    }
    if (datos.fechaInicio.getTime() > Date.now()) {
        throw new ExperienciaInvalidaError('La fecha de inicio no puede ser futura');
    }
    if (datos.fechaFin !== null) {
        if (Number.isNaN(datos.fechaFin.getTime())) {
        throw new ExperienciaInvalidaError('La fecha de finalización no es válida');
        }
        if (datos.fechaFin < datos.fechaInicio) {
        throw new ExperienciaInvalidaError('La fecha de finalización no puede ser anterior a la de inicio');
        }
    }
    }
}

export class HojaDeVida {
    readonly operario: Operario;
    private readonly _experiencias: ExperienciaLaboral[];

    constructor(operario: Operario, experiencias: ExperienciaLaboral[] = []) {
    this.operario = operario;
    this._experiencias = [...experiencias];
    }

  // Copia de la lista: desde afuera no se pueden agregar ni quitar experiencias
    get experiencias(): readonly ExperienciaLaboral[] {
    return [...this._experiencias];
    }

    agregarExperiencia(experiencia: ExperienciaLaboral): void {
    if (experiencia.operarioId !== this.operario.id) {
        throw new ExperienciaInvalidaError('La experiencia pertenece a otro operario');
    }
    this._experiencias.push(experiencia);
    }
}