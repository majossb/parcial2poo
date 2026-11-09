// Hoja de vida: un operario junto con su experiencia laboral y su formación (RF-03)
import { randomUUID } from 'node:crypto';
import { Operario } from './operario.js';

export class ExperienciaInvalidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ExperienciaInvalidaError';
  }
}

export class FormacionInvalidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'FormacionInvalidaError';
  }
}

// ---------- Experiencia laboral ----------

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

// ---------- Formación: estudios, cursos y certificaciones ----------

export const TIPOS_FORMACION = ['academica', 'curso', 'certificacion'];

export interface DatosFormacion {
  tipo: string;
  titulo: string;
  institucion: string;
  fechaObtencion: Date;
  fechaVencimiento: Date | null; // null = no vence
}

export class Formacion {
  readonly id: string;
  readonly operarioId: string;
  private readonly _datos: DatosFormacion;

  private constructor(id: string, operarioId: string, datos: DatosFormacion) {
    this.id = id;
    this.operarioId = operarioId;
    this._datos = datos;
  }

  static crear(operarioId: string, datos: DatosFormacion): Formacion {
    Formacion.validar(datos);
    return new Formacion(randomUUID(), operarioId, {
      ...datos,
      titulo: datos.titulo.trim(),
      institucion: datos.institucion.trim(),
    });
  }

  static reconstruir(id: string, operarioId: string, datos: DatosFormacion): Formacion {
    return new Formacion(id, operarioId, datos);
  }

  get datos(): Readonly<DatosFormacion> {
    return { ...this._datos };
  }

  // Una formación sin fecha de vencimiento siempre está vigente
  estaVigente(hoy: Date = new Date()): boolean {
    if (!this._datos.fechaVencimiento) return true;
    const inicioDeHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return this._datos.fechaVencimiento >= inicioDeHoy;
  }

  private static validar(datos: DatosFormacion): void {
    if (!TIPOS_FORMACION.includes(datos.tipo)) {
      throw new FormacionInvalidaError('El tipo de formación no es válido');
    }
    if (!datos.titulo || datos.titulo.trim() === '') {
      throw new FormacionInvalidaError('El título es obligatorio');
    }
    if (!datos.institucion || datos.institucion.trim() === '') {
      throw new FormacionInvalidaError('La institución es obligatoria');
    }
    if (Number.isNaN(datos.fechaObtencion.getTime())) {
      throw new FormacionInvalidaError('La fecha de obtención no es válida');
    }
    if (datos.fechaObtencion.getTime() > Date.now()) {
      throw new FormacionInvalidaError('La fecha de obtención no puede ser futura');
    }
    if (datos.fechaVencimiento !== null) {
      if (Number.isNaN(datos.fechaVencimiento.getTime())) {
        throw new FormacionInvalidaError('La fecha de vencimiento no es válida');
      }
      if (datos.fechaVencimiento < datos.fechaObtencion) {
        throw new FormacionInvalidaError('La fecha de vencimiento no puede ser anterior a la de obtención');
      }
    }
  }
}

// ---------- Hoja de vida: la carpeta completa ----------

export class HojaDeVida {
  readonly operario: Operario;
  private readonly _experiencias: ExperienciaLaboral[];
  private readonly _formaciones: Formacion[];

  constructor(operario: Operario, experiencias: ExperienciaLaboral[] = [], formaciones: Formacion[] = []) {
    this.operario = operario;
    this._experiencias = [...experiencias];
    this._formaciones = [...formaciones];
  }

  // Copias de las listas: desde afuera no se pueden agregar ni quitar elementos
  get experiencias(): readonly ExperienciaLaboral[] {
    return [...this._experiencias];
  }

  get formaciones(): readonly Formacion[] {
    return [...this._formaciones];
  }

  // Certificaciones que ya vencieron y el operario debe renovar
  get certificacionesVencidas(): readonly Formacion[] {
    return this._formaciones.filter((f) => f.datos.tipo === 'certificacion' && !f.estaVigente());
  }

  agregarExperiencia(experiencia: ExperienciaLaboral): void {
    if (experiencia.operarioId !== this.operario.id) {
      throw new ExperienciaInvalidaError('La experiencia pertenece a otro operario');
    }
    this._experiencias.push(experiencia);
  }

  agregarFormacion(formacion: Formacion): void {
    if (formacion.operarioId !== this.operario.id) {
      throw new FormacionInvalidaError('La formación pertenece a otro operario');
    }
    this._formaciones.push(formacion);
  }
}