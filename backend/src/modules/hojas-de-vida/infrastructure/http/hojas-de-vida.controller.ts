// Controlador HTTP de hojas de vida: valida la forma de la petición con zod y llama a los casos de uso.
import type { Request, Response } from 'express';
import { z } from 'zod';
import type { Operario } from '../../domain/operario.js';
import type { ExperienciaLaboral, HojaDeVida } from '../../domain/hoja-de-vida.js';
import type { ActualizarOperario } from '../../application/use-cases/actualizar-operario.js';
import type { AgregarExperiencia } from '../../application/use-cases/agregar-experiencia.js';
import type { CambiarEstadoOperario } from '../../application/use-cases/cambiar-estado-operario.js';
import type { ConsultarHojaDeVida } from '../../application/use-cases/consultar-hoja-de-vida.js';
import type { ListarOperarios } from '../../application/use-cases/listar-operarios.js';
import type { RegistrarOperario } from '../../application/use-cases/registrar-operario.js';

// Fechas sin hora ('AAAA-MM-DD'), creadas en hora local para que no cambie el día
const fechaDia = z.iso
  .date({ message: 'Debe ser una fecha AAAA-MM-DD' })
  .transform((s) => {
    const [anio, mes, dia] = s.split('-').map(Number);
    return new Date(anio!, mes! - 1, dia!);
  });

const textoOpcional = z.string().nullable().optional().transform((v) => v ?? null);

const esquemaOperario = z.object({
  documentoIdentidad: z.string(),
  nombres: z.string(),
  apellidos: z.string(),
  telefono: textoOpcional,
  direccion: textoOpcional,
  cargo: z.string(),
  fechaIngreso: fechaDia,
});

const esquemaRegistro = esquemaOperario.extend({
  correo: z.string(),
  contrasenaInicial: z.string(),
});

const esquemaEstado = z.object({ activo: z.boolean() });

const esquemaExperiencia = z.object({
  empresa: z.string(),
  cargo: z.string(),
  fechaInicio: fechaDia,
  fechaFin: fechaDia.nullable().optional().transform((v) => v ?? null),
  descripcion: textoOpcional,
});

const esquemaId = z.guid({ message: 'El id del operario no es válido' });

const esquemaListado = z.object({
  soloActivos: z.enum(['true', 'false']).optional(),
});

// Convierte una fecha a 'AAAA-MM-DD' para la respuesta
function fechaTexto(fecha: Date | null): string | null {
  if (!fecha) return null;
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// Las clases tienen datos privados: aquí se arma lo que sí se envía al frontend
function operarioARespuesta(o: Operario) {
  const d = o.datos;
  return {
    id: o.id,
    usuarioId: o.usuarioId,
    documentoIdentidad: d.documentoIdentidad,
    nombres: d.nombres,
    apellidos: d.apellidos,
    nombreCompleto: o.nombreCompleto,
    telefono: d.telefono,
    direccion: d.direccion,
    cargo: d.cargo,
    fechaIngreso: fechaTexto(d.fechaIngreso),
    activo: o.activo,
  };
}

function experienciaARespuesta(e: ExperienciaLaboral) {
  const d = e.datos;
  return {
    id: e.id,
    empresa: d.empresa,
    cargo: d.cargo,
    fechaInicio: fechaTexto(d.fechaInicio),
    fechaFin: fechaTexto(d.fechaFin),
    descripcion: d.descripcion,
  };
}

function hojaDeVidaARespuesta(h: HojaDeVida) {
  return {
    operario: operarioARespuesta(h.operario),
    experiencias: h.experiencias.map(experienciaARespuesta),
  };
}

export class HojasDeVidaController {
  private readonly registrarOperario: RegistrarOperario;
  private readonly actualizarOperario: ActualizarOperario;
  private readonly cambiarEstadoOperario: CambiarEstadoOperario;
  private readonly consultarHojaDeVida: ConsultarHojaDeVida;
  private readonly listarOperarios: ListarOperarios;
  private readonly agregarExperiencia: AgregarExperiencia;

  constructor(
    registrarOperario: RegistrarOperario,
    actualizarOperario: ActualizarOperario,
    cambiarEstadoOperario: CambiarEstadoOperario,
    consultarHojaDeVida: ConsultarHojaDeVida,
    listarOperarios: ListarOperarios,
    agregarExperiencia: AgregarExperiencia,
  ) {
    this.registrarOperario = registrarOperario;
    this.actualizarOperario = actualizarOperario;
    this.cambiarEstadoOperario = cambiarEstadoOperario;
    this.consultarHojaDeVida = consultarHojaDeVida;
    this.listarOperarios = listarOperarios;
    this.agregarExperiencia = agregarExperiencia;
  }

  // RF-04
  listar = async (req: Request, res: Response): Promise<void> => {
    const { soloActivos } = esquemaListado.parse(req.query);
    const operarios = await this.listarOperarios.ejecutar({ soloActivos: soloActivos === 'true' });
    res.json({ operarios: operarios.map(operarioARespuesta) });
  };

  // RF-05
  consultar = async (req: Request, res: Response): Promise<void> => {
    const id = esquemaId.parse(req.params.id);
    const hojaDeVida = await this.consultarHojaDeVida.ejecutar(id);
    res.json(hojaDeVidaARespuesta(hojaDeVida));
  };

  // RF-02
  registrar = async (req: Request, res: Response): Promise<void> => {
    const solicitud = esquemaRegistro.parse(req.body);
    const operario = await this.registrarOperario.ejecutar(solicitud);
    res.status(201).json(operarioARespuesta(operario));
  };

  // RF-03
  actualizar = async (req: Request, res: Response): Promise<void> => {
    const id = esquemaId.parse(req.params.id);
    const datos = esquemaOperario.parse(req.body);
    const operario = await this.actualizarOperario.ejecutar(id, datos);
    res.json(operarioARespuesta(operario));
  };

  // RF-04
  cambiarEstado = async (req: Request, res: Response): Promise<void> => {
    const id = esquemaId.parse(req.params.id);
    const { activo } = esquemaEstado.parse(req.body);
    const operario = await this.cambiarEstadoOperario.ejecutar(id, activo);
    res.json(operarioARespuesta(operario));
  };

  // RF-03
  nuevaExperiencia = async (req: Request, res: Response): Promise<void> => {
    const id = esquemaId.parse(req.params.id);
    const datos = esquemaExperiencia.parse(req.body);
    const experiencia = await this.agregarExperiencia.ejecutar(id, datos);
    res.status(201).json(experienciaARespuesta(experiencia));
  };
}