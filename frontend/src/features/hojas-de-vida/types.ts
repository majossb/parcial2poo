// Tipos de datos del módulo de hojas de vida (coinciden con las respuestas del backend)
export interface Operario {
  readonly id: string;
  readonly usuarioId: string;
  readonly tipoDocumento: string;
  readonly documentoIdentidad: string;
  readonly nombres: string;
  readonly apellidos: string;
  readonly nombreCompleto: string;
  readonly fechaNacimiento: string | null; // 'AAAA-MM-DD'
  readonly edad: number | null;
  readonly telefono: string | null;
  readonly direccion: string | null;
  readonly cargo: string;
  readonly fechaIngreso: string; // 'AAAA-MM-DD'
  readonly especialidades: readonly string[];
  readonly tipoSangre: string | null;
  readonly eps: string | null;
  readonly arl: string | null;
  readonly contactoEmergenciaNombre: string | null;
  readonly contactoEmergenciaTelefono: string | null;
  readonly activo: boolean;
}

export interface ExperienciaLaboral {
  readonly id: string;
  readonly empresa: string;
  readonly cargo: string;
  readonly fechaInicio: string;
  readonly fechaFin: string | null; // null = todavía trabaja allí
  readonly descripcion: string | null;
}

export interface Formacion {
  readonly id: string;
  readonly tipo: string;
  readonly titulo: string;
  readonly institucion: string;
  readonly fechaObtencion: string;
  readonly fechaVencimiento: string | null; // null = no vence
  readonly vigente: boolean;
}

export interface HojaDeVida {
  readonly operario: Operario;
  readonly experiencias: readonly ExperienciaLaboral[];
  readonly formaciones: readonly Formacion[];
}
// Lo que se envía al backend para registrar o actualizar
export interface DatosOperario {
  tipoDocumento: string;
  documentoIdentidad: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string | null;
  telefono: string | null;
  direccion: string | null;
  cargo: string;
  fechaIngreso: string;
  especialidades: string[];
  tipoSangre: string | null;
  eps: string | null;
  arl: string | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
}

export interface SolicitudRegistroOperario extends DatosOperario {
  correo: string;
  contrasenaInicial: string;
}

export interface DatosExperiencia {
  empresa: string;
  cargo: string;
  fechaInicio: string;
  fechaFin: string | null;
  descripcion: string | null;
}

// Listas de opciones: el valor viaja al backend y el nombre se muestra en pantalla
export const TIPOS_SANGRE = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export const TIPOS_DOCUMENTO = [
  { valor: 'CC', nombre: 'Cédula de ciudadanía' },
  { valor: 'CE', nombre: 'Cédula de extranjería' },
  { valor: 'PPT', nombre: 'Permiso de protección temporal' },
  { valor: 'PA', nombre: 'Pasaporte' },
];

export const ESPECIALIDADES = [
  { valor: 'piscinas', nombre: 'Piscinas' },
  { valor: 'pintura', nombre: 'Pintura' },
  { valor: 'jardineria', nombre: 'Jardinería' },
  { valor: 'pasillos', nombre: 'Pasillos' },
  { valor: 'mantenimiento_general', nombre: 'Mantenimiento general' },
];

export function nombreEspecialidad(valor: string): string {
  return ESPECIALIDADES.find((e) => e.valor === valor)?.nombre ?? valor;
}
export interface DatosFormacion {
  tipo: string;
  titulo: string;
  institucion: string;
  fechaObtencion: string;
  fechaVencimiento: string | null;
}

export const TIPOS_FORMACION = [
  { valor: 'academica', nombre: 'Estudio académico' },
  { valor: 'curso', nombre: 'Curso' },
  { valor: 'certificacion', nombre: 'Certificación' },
];

export function nombreTipoFormacion(valor: string): string {
  return TIPOS_FORMACION.find((t) => t.valor === valor)?.nombre ?? valor;
}