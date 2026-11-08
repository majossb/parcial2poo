// Adaptador de salida: crea la cuenta de acceso del operario en la tabla usuarios
import bcrypt from 'bcryptjs';
import type { Pool } from '../../../../shared/database/pool.js';
import {
    CuentaInvalidaError,
    type CuentasUsuario,
} from '../../application/ports/cuentas-usuario.js';

const ROL_OPERARIO = 4; // definido en database/seeds
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class PostgresCuentasUsuario implements CuentasUsuario {
    private readonly pool: Pool;

    constructor(pool: Pool) {
    this.pool = pool;
    }

    async crearCuentaOperario(correo: string, contrasenaInicial: string): Promise<string> {
    const correoLimpio = correo.trim().toLowerCase();
    if (!CORREO.test(correoLimpio)) {
        throw new CuentaInvalidaError('El correo no es válido');
    }
    if (contrasenaInicial.length < 8) {
        throw new CuentaInvalidaError('La contraseña inicial debe tener al menos 8 caracteres');
    }

    const existe = await this.pool.query(
        'SELECT 1 FROM usuarios WHERE lower(correo) = $1',
        [correoLimpio],
    );
    if (existe.rowCount) {
        throw new CuentaInvalidaError('Ya existe una cuenta con ese correo');
    }

    // La contraseña nunca se guarda tal cual: se guarda cifrada con bcrypt
    const hash = await bcrypt.hash(contrasenaInicial, 10);
    const r = await this.pool.query<{ id: string }>(
        `INSERT INTO usuarios (correo, password_hash, rol_id)
        VALUES ($1, $2, $3)
        RETURNING id`,
        [correoLimpio, hash, ROL_OPERARIO],
    );
    const fila = r.rows[0];
    if (!fila) {
        throw new Error('No se pudo crear la cuenta del operario');
    }
    return fila.id;
    }
}