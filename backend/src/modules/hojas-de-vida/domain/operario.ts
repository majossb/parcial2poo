// Entidad Operario: datos personales, laborales, de salud y de emergencia del trabajador (RF-02)
import { randomUUID } from 'node:crypto';

export class OperarioInvalidoError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'OperarioInvalidoError';
  }
}

export class OperarioNoEncontradoError extends Error {
  constructor(id: string) {
    super(`No existe un operario con id ${id}`);
    this.name = 'OperarioNoEncontradoError';
  }
}

export interface DatosOperario {
  // Datos personales
  tipoDocumento: string;
  documentoIdentidad: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: Date | null;
  telefono: string | null;
  direccion: string | null;
  // Datos laborales
  cargo: string;
  fechaIngreso: Date;
  especialidades: string[];
  // Salud y emergencia (pueden faltar en operarios registrados antes de agregarlos)
  tipoSangre: string | null;
  eps: string | null;
  arl: string | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
}

const DOCUMENTO = /^[A-Za-z0-9]{5,20}$/;
export const TIPOS_DOCUMENTO = ['CC', 'CE', 'PPT', 'PA'];
export const ESPECIALIDADES = ['piscinas', 'pintura', 'jardineria', 'pasillos', 'mantenimiento_general'];
export const TIPOS_SANGRE = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const EDAD_MINIMA = 18;

export function calcularEdad(nacimiento: Date, hoy: Date = new Date()): number {
  const edad = hoy.getFullYear() - nacimiento.getFullYear();
  const aunNoCumple =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
  return aunNoCumple ? edad - 1 : edad;
}

export class Operario {
  readonly id: string;
  readonly usuarioId: string;
  private _datos: DatosOperario;
  private _activo: boolean;

  // Privado: solo se crean operarios con crear() o reconstruir()
  private constructor(id: string, usuarioId: string, datos: DatosOperario, activo: boolean) {
    this.id = id;
    this.usuarioId = usuarioId;
    this._datos = datos;
    this._activo = activo;
  }

  // Operario nuevo: valida los datos antes de existir
  static crear(usuarioId: string, datos: DatosOperario): Operario {
    Operario.validar(datos);
    return new Operario(randomUUID(), usuarioId, Operario.limpiar(datos), true);
  }

  // Operario que ya existe en la base de datos (ya fue validado al crearlo)
  static reconstruir(id: string, usuarioId: string, datos: DatosOperario, activo: boolean): Operario {
    return new Operario(id, usuarioId, datos, activo);
  }

  // Se entrega una copia (también de la lista) para que nadie modifique los datos desde afuera
  get datos(): Readonly<DatosOperario> {
    return { ...this._datos, especialidades: [...this._datos.especialidades] };
  }

  get nombreCompleto(): string {
    return `${this._datos.nombres} ${this._datos.apellidos}`;
  }

  get edad(): number | null {
    return this._datos.fechaNacimiento ? calcularEdad(this._datos.fechaNacimiento) : null;
  }

  get activo(): boolean {
    return this._activo;
  }

  tieneEspecialidad(especialidad: string): boolean {
    return this._datos.especialidades.includes(especialidad);
  }

  actualizar(datos: DatosOperario): void {
    Operario.validar(datos);
    this._datos = Operario.limpiar(datos);
  }

  activar(): void {
    this._activo = true;
  }

  desactivar(): void {
    this._activo = false;
  }

  static validar(datos: DatosOperario): void {
    const obligatorios: [string, string | null][] = [
      ['documentoIdentidad', datos.documentoIdentidad],
      ['nombres', datos.nombres],
      ['apellidos', datos.apellidos],
      ['cargo', datos.cargo],
      ['eps', datos.eps],
      ['arl', datos.arl],
      ['contactoEmergenciaNombre', datos.contactoEmergenciaNombre],
      ['contactoEmergenciaTelefono', datos.contactoEmergenciaTelefono],
    ];
    for (const [campo, valor] of obligatorios) {
      if (!valor || valor.trim() === '') {
        throw new OperarioInvalidoError(`El campo ${campo} es obligatorio`);
      }
    }
    if (!TIPOS_DOCUMENTO.includes(datos.tipoDocumento)) {
      throw new OperarioInvalidoError('El tipo de documento no es válido');
    }
    if (!DOCUMENTO.test(datos.documentoIdentidad.trim())) {
      throw new OperarioInvalidoError('El documento debe tener entre 5 y 20 letras o números');
    }
    if (Number.isNaN(datos.fechaIngreso.getTime())) {
      throw new OperarioInvalidoError('La fecha de ingreso no es válida');
    }
    if (datos.fechaIngreso.getTime() > Date.now()) {
      throw new OperarioInvalidoError('La fecha de ingreso no puede ser futura');
    }
    if (!datos.fechaNacimiento || Number.isNaN(datos.fechaNacimiento.getTime())) {
      throw new OperarioInvalidoError('La fecha de nacimiento es obligatoria');
    }
    if (calcularEdad(datos.fechaNacimiento) < EDAD_MINIMA) {
      throw new OperarioInvalidoError(`El operario debe tener al menos ${EDAD_MINIMA} años`);
    }
    if (datos.tipoSangre && !TIPOS_SANGRE.includes(datos.tipoSangre.trim().toUpperCase())) {
      throw new OperarioInvalidoError('El tipo de sangre no es válido');
    }
    // Se necesita al menos una para poder asignarle actividades en la programación
    if (datos.especialidades.length === 0) {
      throw new OperarioInvalidoError('Selecciona al menos una especialidad');
    }
    for (const especialidad of datos.especialidades) {
      if (!ESPECIALIDADES.includes(especialidad)) {
        throw new OperarioInvalidoError(`La especialidad "${especialidad}" no es válida`);
      }
    }
  }

  // Quita espacios sobrantes, repetidos, y convierte los campos opcionales vacíos en null
  private static limpiar(datos: DatosOperario): DatosOperario {
    const opcional = (valor: string | null) => (valor && valor.trim() !== '' ? valor.trim() : null);
    return {
      tipoDocumento: datos.tipoDocumento,
      documentoIdentidad: datos.documentoIdentidad.trim(),
      nombres: datos.nombres.trim(),
      apellidos: datos.apellidos.trim(),
      fechaNacimiento: datos.fechaNacimiento,
      telefono: opcional(datos.telefono),
      direccion: opcional(datos.direccion),
      cargo: datos.cargo.trim(),
      fechaIngreso: datos.fechaIngreso,
      especialidades: [...new Set(datos.especialidades)],
      tipoSangre: opcional(datos.tipoSangre)?.toUpperCase() ?? null,
      eps: opcional(datos.eps),
      arl: opcional(datos.arl),
      contactoEmergenciaNombre: opcional(datos.contactoEmergenciaNombre),
      contactoEmergenciaTelefono: opcional(datos.contactoEmergenciaTelefono),
    };
  }
}