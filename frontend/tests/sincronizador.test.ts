// Pruebas unitarias del sincronizador con dependencias falsas (RF-08)
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db, type MarcacionLocal } from '../src/offline/db.js';
import { colaMarcaciones } from '../src/offline/cola-marcaciones.js';
import {
  Sincronizador,
  type ItemMarcacionSync,
  type RespuestaServidorSync,
} from '../src/offline/sincronizador.js';
import { ErrorApi, ErrorDeRed } from '../src/shared/api/http-client.js';

describe('Sincronizador de marcaciones', () => {
  const usuario1 = 'usuario-uuid-1';
  const usuario2 = 'usuario-uuid-2';
  const tokenFalso = 'token-jwt-valido';

  beforeEach(async () => {
    await db.marcacionesPendientes.clear();
  });

  const crearMarca = (id: string, usuarioId: string, tipo: 'entrada' | 'salida', hora: string): MarcacionLocal => ({
    id,
    usuarioId,
    conjuntoId: 'conjunto-1',
    tipo,
    registradaEnDispositivo: `2026-11-08T${hora}:00.000Z`,
    estado: 'pendiente',
    creadaLocalmente: `2026-11-08T${hora}:00.000Z`,
  });

  it('(a) envía solo las del usuario actual y en orden temporal', async () => {
    await colaMarcaciones.agregar(crearMarca('m1', usuario1, 'salida', '17:00'));
    await colaMarcaciones.agregar(crearMarca('m2', usuario1, 'entrada', '08:00'));
    await colaMarcaciones.agregar(crearMarca('m3', usuario2, 'entrada', '09:00'));

    const lotesEnviados: ItemMarcacionSync[][] = [];
    const enviarLoteMock = vi.fn(async (_tok: string, lote: ItemMarcacionSync[]): Promise<RespuestaServidorSync> => {
      lotesEnviados.push(lote);
      return {
        resultados: lote.map((item) => ({ id: item.id, resultado: 'creada', estadoRevision: 'normal' })),
      };
    });

    const sinc = new Sincronizador({
      cola: colaMarcaciones,
      enviarLote: enviarLoteMock,
      obtenerToken: () => tokenFalso,
    });

    const res = await sinc.sincronizar(usuario1);
    expect(res.tipo).toBe('exito');
    expect(enviarLoteMock).toHaveBeenCalledTimes(1);

    expect(lotesEnviados[0]?.map((m) => m.id)).toEqual(['m2', 'm1']);

    // La marcación del usuario2 no fue tocada
    const pendientesUsuario2 = await colaMarcaciones.pendientesDelUsuario(usuario2);
    expect(pendientesUsuario2).toHaveLength(1);
    expect(pendientesUsuario2[0]?.id).toBe('m3');
  });

  it('(b) "creada" y "duplicada" se eliminan de la cola; "rechazada" queda marcada y no se reenvía', async () => {
    await colaMarcaciones.agregar(crearMarca('m1', usuario1, 'entrada', '08:00'));
    await colaMarcaciones.agregar(crearMarca('m2', usuario1, 'salida', '12:00'));
    await colaMarcaciones.agregar(crearMarca('m3', usuario1, 'salida', '17:00'));

    const enviarLoteMock = vi.fn(async (): Promise<RespuestaServidorSync> => ({
      resultados: [
        { id: 'm1', resultado: 'creada', estadoRevision: 'normal' },
        { id: 'm2', resultado: 'duplicada' },
        { id: 'm3', resultado: 'rechazada', motivo: 'Hora inconsistente' },
      ],
    }));

    const sinc = new Sincronizador({
      cola: colaMarcaciones,
      enviarLote: enviarLoteMock,
      obtenerToken: () => tokenFalso,
    });

    const res = await sinc.sincronizar(usuario1);
    expect(res.tipo).toBe('exito');
    expect(res.enviadas).toBe(1);
    expect(res.duplicadas).toBe(1);
    expect(res.rechazadas).toBe(1);

    // m1 y m2 ya no están en la cola
    const todas = await colaMarcaciones.listarDelUsuario(usuario1);
    expect(todas).toHaveLength(1);
    expect(todas[0]?.id).toBe('m3');
    expect(todas[0]?.estado).toBe('rechazada');
    expect(todas[0]?.motivoRechazo).toBe('Hora inconsistente');

    // Al sincronizar de nuevo, no hay nada pendiente
    const res2 = await sinc.sincronizar(usuario1);
    expect(res2.tipo).toBe('nada_que_enviar');
    expect(enviarLoteMock).toHaveBeenCalledTimes(1); // No volvió a llamar a la API
  });

  it('(c) 401 conserva toda la cola y devuelve "sesion_vencida"', async () => {
    await colaMarcaciones.agregar(crearMarca('m1', usuario1, 'entrada', '08:00'));

    const sinc = new Sincronizador({
      cola: colaMarcaciones,
      enviarLote: async () => {
        throw new ErrorApi(401, 'Token vencido');
      },
      obtenerToken: () => tokenFalso,
    });

    const res = await sinc.sincronizar(usuario1);
    expect(res.tipo).toBe('sesion_vencida');

    const pendientes = await colaMarcaciones.pendientesDelUsuario(usuario1);
    expect(pendientes).toHaveLength(1);
  });

  it('(c) 403 conserva la cola y devuelve "sin_permiso" con mensaje del servidor', async () => {
    await colaMarcaciones.agregar(crearMarca('m1', usuario1, 'entrada', '08:00'));

    const sinc = new Sincronizador({
      cola: colaMarcaciones,
      enviarLote: async () => {
        throw new ErrorApi(403, 'Tu usuario no tiene una hoja de vida de operario');
      },
      obtenerToken: () => tokenFalso,
    });

    const res = await sinc.sincronizar(usuario1);
    expect(res.tipo).toBe('sin_permiso');
    expect(res.mensaje).toBe('Tu usuario no tiene una hoja de vida de operario');

    const pendientes = await colaMarcaciones.pendientesDelUsuario(usuario1);
    expect(pendientes).toHaveLength(1);
  });

  it('(c) error de red conserva la cola y devuelve "sin_conexion" sin borrar nada', async () => {
    await colaMarcaciones.agregar(crearMarca('m1', usuario1, 'entrada', '08:00'));

    const sinc = new Sincronizador({
      cola: colaMarcaciones,
      enviarLote: async () => {
        throw new ErrorDeRed('Failed to fetch');
      },
      obtenerToken: () => tokenFalso,
    });

    const res = await sinc.sincronizar(usuario1);
    expect(res.tipo).toBe('sin_conexion');

    const pendientes = await colaMarcaciones.pendientesDelUsuario(usuario1);
    expect(pendientes).toHaveLength(1);
  });

  it('(d) lotes de más de 200 marcaciones se parten en bloques de 200', async () => {
    const total = 205;
    for (let i = 1; i <= total; i++) {
      const hora = String(i % 24).padStart(2, '0');
      const min = String(i % 60).padStart(2, '0');
      await colaMarcaciones.agregar(crearMarca(`m-${i}`, usuario1, 'entrada', `${hora}:${min}`));
    }

    const lotesRecibidos: ItemMarcacionSync[][] = [];
    const sinc = new Sincronizador({
      cola: colaMarcaciones,
      enviarLote: async (_tok, lote) => {
        lotesRecibidos.push(lote);
        return {
          resultados: lote.map((x) => ({ id: x.id, resultado: 'creada', estadoRevision: 'normal' })),
        };
      },
      obtenerToken: () => tokenFalso,
    });

    const res = await sinc.sincronizar(usuario1);
    expect(res.tipo).toBe('exito');
    expect(lotesRecibidos).toHaveLength(2);
    expect(lotesRecibidos[0]).toHaveLength(200);
    expect(lotesRecibidos[1]).toHaveLength(5);

    expect(await colaMarcaciones.contar(usuario1)).toBe(0);
  });

  it('(e) dos llamadas simultáneas no envían dos veces (candado de concurrencia)', async () => {
    await colaMarcaciones.agregar(crearMarca('m1', usuario1, 'entrada', '08:00'));

    let resolverLote: ((v: RespuestaServidorSync) => void) | null = null;
    const llamadaPromesa = new Promise<RespuestaServidorSync>((resolve) => {
      resolverLote = resolve;
    });

    const enviarLoteMock = vi.fn(async () => llamadaPromesa);

    const sinc = new Sincronizador({
      cola: colaMarcaciones,
      enviarLote: enviarLoteMock,
      obtenerToken: () => tokenFalso,
    });

    const promesa1 = sinc.sincronizar(usuario1);
    const promesa2 = sinc.sincronizar(usuario1);

    const res2 = await promesa2;
    expect(res2.tipo).toBe('en_curso');

    resolverLote!({
      resultados: [{ id: 'm1', resultado: 'creada', estadoRevision: 'normal' }],
    });

    const res1 = await promesa1;
    expect(res1.tipo).toBe('exito');
    expect(enviarLoteMock).toHaveBeenCalledTimes(1);
  });

  it('(f) reenviar tras corte a mitad de lote es idempotente y no duplica', async () => {
    await colaMarcaciones.agregar(crearMarca('m1', usuario1, 'entrada', '08:00'));
    await colaMarcaciones.agregar(crearMarca('m2', usuario1, 'salida', '12:00'));

    let intentos = 0;
    const sinc = new Sincronizador({
      cola: colaMarcaciones,
      enviarLote: async (_tok, lote) => {
        intentos++;
        if (intentos === 1) {
          // El primer intento solo procesa m1 en el servidor y luego la conexión se cae
          await colaMarcaciones.eliminar('m1');
          throw new ErrorDeRed('Corte de red a mitad');
        }
        // Segundo intento: el servidor recibe m2 y responde duplicada si ya la tuviera
        return {
          resultados: lote.map((x) => ({ id: x.id, resultado: 'duplicada' })),
        };
      },
      obtenerToken: () => tokenFalso,
    });

    const res1 = await sinc.sincronizar(usuario1);
    expect(res1.tipo).toBe('sin_conexion');

    // m1 fue eliminada, queda m2
    expect(await colaMarcaciones.contar(usuario1)).toBe(1);

    // Segundo intento con red restablecida
    const res2 = await sinc.sincronizar(usuario1);
    expect(res2.tipo).toBe('exito');
    expect(res2.duplicadas).toBe(1);

    // La cola quedó vacía sin duplicados
    expect(await colaMarcaciones.contar(usuario1)).toBe(0);
  });
});
