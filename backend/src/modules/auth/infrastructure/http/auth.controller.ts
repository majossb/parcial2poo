// Controlador HTTP de auth: valida la forma de la petición con zod y llama al caso de uso.
// Las reglas de negocio (formato del correo, largo de la contraseña) viven en el dominio.
import type { Request, Response } from 'express';
import { z } from 'zod';
import type { IniciarSesion } from '../../application/use-cases/iniciar-sesion.js';
import type { CerrarSesion } from '../../application/use-cases/cerrar-sesion.js';
import type { CrearUsuario } from '../../application/use-cases/crear-usuario.js';

const esquemaLogin = z.object({
  correo: z.string().min(1, 'El correo es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

const esquemaCrearUsuario = z.object({
  correo: z.string().min(1, 'El correo es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
  rol: z.string().min(1, 'El rol es obligatorio'),
});

export class AuthController {
  private readonly iniciarSesion: IniciarSesion;
  private readonly cerrarSesion: CerrarSesion;
  private readonly crearUsuario: CrearUsuario;

  constructor(iniciarSesion: IniciarSesion, cerrarSesion: CerrarSesion, crearUsuario: CrearUsuario) {
    this.iniciarSesion = iniciarSesion;
    this.cerrarSesion = cerrarSesion;
    this.crearUsuario = crearUsuario;
  }

  login = async (req: Request, res: Response): Promise<void> => {
    const datos = esquemaLogin.parse(req.body);
    const resultado = await this.iniciarSesion.ejecutar(datos);
    res.json(resultado);
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    await this.cerrarSesion.ejecutar(req.usuario!.usuarioId);
    res.status(204).end();
  };

  // La ruta ya exigió rol administrador antes de llegar aquí.
  crear = async (req: Request, res: Response): Promise<void> => {
    const datos = esquemaCrearUsuario.parse(req.body);
    const usuario = await this.crearUsuario.ejecutar(datos);
    res.status(201).json(usuario);
  };
}