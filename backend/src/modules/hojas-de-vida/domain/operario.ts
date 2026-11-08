// Entidad Operario: datos personales y laborales del trabajador (RF-02)
import { randomUUID } from 'node:crypto';

export class OperarioInvalidoError extends Error {
    constructor(mensaje: string) {
    super(mensaje);
    this.name = 'OperarioInvalidoError';
    }
}

export interface DatosOperario {
    documentoIdentidad: string;
    nombres: string;
    apellidos: string;
    telefono: string | null;
    direccion: string | null;
    cargo: string;
    fechaIngreso: Date;
}

const DOCUMENTO = /^[A-Za-z0-9]{5,20}$/;

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

  // Se entrega una copia para que nadie pueda modificar los datos desde afuera
    get datos(): Readonly<DatosOperario> {
    return { ...this._datos };
    }

    get nombreCompleto(): string {
    return `${this._datos.nombres} ${this._datos.apellidos}`;
    }

    get activo(): boolean {
    return this._activo;
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

    private static validar(datos: DatosOperario): void {
    const obligatorios: [string, string][] = [
        ['documentoIdentidad', datos.documentoIdentidad],
        ['nombres', datos.nombres],
        ['apellidos', datos.apellidos],
        ['cargo', datos.cargo],
    ];
    for (const [campo, valor] of obligatorios) {
        if (!valor || valor.trim() === '') {
        throw new OperarioInvalidoError(`El campo ${campo} es obligatorio`);
        }
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
    }

  // Quita espacios sobrantes y convierte los campos opcionales vacíos en null
    private static limpiar(datos: DatosOperario): DatosOperario {
    const opcional = (valor: string | null) => (valor && valor.trim() !== '' ? valor.trim() : null);
    return {
        documentoIdentidad: datos.documentoIdentidad.trim(),
        nombres: datos.nombres.trim(),
        apellidos: datos.apellidos.trim(),
        telefono: opcional(datos.telefono),
        direccion: opcional(datos.direccion),
        cargo: datos.cargo.trim(),
        fechaIngreso: datos.fechaIngreso,
    };
    }
}