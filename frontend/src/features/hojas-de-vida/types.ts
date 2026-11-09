// Tipos de datos del módulo de hojas de vida (coinciden con las respuestas del backend)
export interface Operario {
    readonly id: string;
    readonly usuarioId: string;
    readonly documentoIdentidad: string;
    readonly nombres: string;
    readonly apellidos: string;
    readonly nombreCompleto: string;
    readonly telefono: string | null;
    readonly direccion: string | null;
    readonly cargo: string;
  readonly fechaIngreso: string; // 'AAAA-MM-DD'
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

export interface HojaDeVida {
    readonly operario: Operario;
    readonly experiencias: readonly ExperienciaLaboral[];
}

// Lo que se envía al backend para registrar o actualizar
export interface DatosOperario {
    documentoIdentidad: string;
    nombres: string;
    apellidos: string;
    telefono: string | null;
    direccion: string | null;
    cargo: string;
    fechaIngreso: string;
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