// Controlador HTTP de asistencia: valida la forma de la petición con zod y llama a los casos de uso.
// El operario de una marcación SIEMPRE sale del token, nunca del cuerpo de la petición.
import type { Request, Response } from 'express';
import { z } from 'zod';
import type { ConsultarHistorial } from '../../application/use-cases/consultar-historial.js';
import type { ListarConjuntos } from '../../application/use-cases/listar-conjuntos.js';
import type { ResolverOperarioDelUsuario } from '../../application/use-cases/resolver-operario-del-usuario.js';
import type { SincronizarMarcaciones } from '../../application/use-cases/sincronizar-marcaciones.js';

// Un lote grande es posible tras varios días sin conexión, pero no infinito.
const MAXIMO_POR_LOTE = 500;
// Protege el tiempo de respuesta de las consultas (meta: p95 <= 2 s).
const DIAS_MAXIMOS_CONSULTA = 92;

// Los campos de cada marcación llegan como texto a propósito: si uno está mal formado
// (UUID inválido, tipo desconocido...), el caso de uso lo rechaza SOLO a él y el resto
// del lote se procesa. Las claves de más (como un "operarioId") se descartan.
const esquemaLote = z.object({
  marcaciones: z
    .array(
      z.object({
        id: z.string(),
        conjuntoId: z.string(),
        tipo: z.string(),
        registradaEnDispositivo: z.string(),
      }),
    )
    .min(1, 'El lote no puede estar vacío')
    .max(MAXIMO_POR_LOTE, `Máximo ${MAXIMO_POR_LOTE} marcaciones por lote`),
});

const fecha = z.iso.datetime({ offset: true, message: 'Debe ser una fecha ISO 8601' }).transform((s) => new Date(s));

const esquemaConsulta = z
  .object({
    desde: fecha,
    hasta: fecha,
    operarioId: z.guid().optional(),
    conjuntoId: z.guid().optional(),
    soloARevisar: z.enum(['true', 'false']).optional(),
  })
  // Si alguna fecha ya falló su propia validación, zod igual corre esta regla con el texto
  // original; por eso se comprueba que sean fechas antes de restarlas.
  .refine(
    (c) =>
      !(c.desde instanceof Date && c.hasta instanceof Date) ||
      c.hasta.getTime() - c.desde.getTime() <= DIAS_MAXIMOS_CONSULTA * 86_400_000,
    {
      message: `El rango no puede superar ${DIAS_MAXIMOS_CONSULTA} días`,
      path: ['hasta'],
    },
  );

export class AsistenciaController {
  private readonly sincronizarMarcaciones: SincronizarMarcaciones;
  private readonly consultarHistorial: ConsultarHistorial;
  private readonly listarConjuntos: ListarConjuntos;
  private readonly resolverOperario: ResolverOperarioDelUsuario;

  constructor(
    sincronizarMarcaciones: SincronizarMarcaciones,
    consultarHistorial: ConsultarHistorial,
    listarConjuntos: ListarConjuntos,
    resolverOperario: ResolverOperarioDelUsuario,
  ) {
    this.sincronizarMarcaciones = sincronizarMarcaciones;
    this.consultarHistorial = consultarHistorial;
    this.listarConjuntos = listarConjuntos;
    this.resolverOperario = resolverOperario;
  }

  // RF-06 y RF-08. Una marcación suelta se envía como lote de una.
  sincronizar = async (req: Request, res: Response): Promise<void> => {
    const { marcaciones } = esquemaLote.parse(req.body);
    const operario = await this.resolverOperario.ejecutar(req.usuario!.usuarioId);
    const resultados = await this.sincronizarMarcaciones.ejecutar(operario.id, marcaciones);
    res.json({ resultados });
  };

  // RF-09, para administrativos y supervisores
  historial = async (req: Request, res: Response): Promise<void> => {
    const c = esquemaConsulta.parse(req.query);
    const resultado = await this.consultarHistorial.ejecutar({
      desde: c.desde,
      hasta: c.hasta,
      operarioId: c.operarioId,
      conjuntoId: c.conjuntoId,
      soloARevisar: c.soloARevisar === 'true',
    });
    res.json(resultado);
  };

  // RF-09, el operario consulta solo lo suyo (ignora cualquier operarioId de la consulta)
  mias = async (req: Request, res: Response): Promise<void> => {
    const c = esquemaConsulta.parse(req.query);
    const operario = await this.resolverOperario.ejecutar(req.usuario!.usuarioId);
    const resultado = await this.consultarHistorial.ejecutar({
      desde: c.desde,
      hasta: c.hasta,
      operarioId: operario.id,
      conjuntoId: c.conjuntoId,
    });
    res.json(resultado);
  };

  conjuntos = async (_req: Request, res: Response): Promise<void> => {
    res.json({ conjuntos: await this.listarConjuntos.ejecutar() });
  };
}