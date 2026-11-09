// Pantalla con la hoja de vida de un operario: datos, experiencia y formación (RF-03, RF-05)
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Tabla, type Columna } from '../../../shared/components/Tabla.js';
import { fechaHoyColombia } from '../../../shared/utils/fechas.js';
import { useSesion } from '../../auth/hooks/useSesion.js';
import {
  apiAgregarExperiencia,
  apiAgregarFormacion,
  apiConsultarHojaDeVida,
} from '../api/hojas-de-vida.api.js';
import { mensajeDeError } from '../errores.js';
import {
  TIPOS_DOCUMENTO,
  TIPOS_FORMACION,
  nombreEspecialidad,
  nombreTipoFormacion,
  type ExperienciaLaboral,
  type Formacion,
  type HojaDeVida,
} from '../types.js';

interface CamposExperiencia {
  empresa: string;
  cargo: string;
  fechaInicio: string;
  fechaFin: string;
  descripcion: string;
}

interface CamposFormacion {
  tipo: string;
  titulo: string;
  institucion: string;
  fechaObtencion: string;
  fechaVencimiento: string;
}

const EXPERIENCIA_VACIA: CamposExperiencia = {
  empresa: '',
  cargo: '',
  fechaInicio: '',
  fechaFin: '',
  descripcion: '',
};

const FORMACION_VACIA: CamposFormacion = {
  tipo: 'certificacion',
  titulo: '',
  institucion: '',
  fechaObtencion: '',
  fechaVencimiento: '',
};

const GRILLA: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '16px',
};

const DOS_COLUMNAS: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };

// Muestra un dato con su etiqueta; si está vacío muestra un guion
function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div>
      <div style={{ fontSize: '0.85em', opacity: 0.7 }}>{etiqueta}</div>
      <div style={{ fontWeight: 600 }}>{valor || '—'}</div>
    </div>
  );
}

export function DetalleOperario() {
  const { id } = useParams<{ id: string }>();
  const { sesion } = useSesion();
  const token = sesion?.token;
  const rol = sesion?.usuario.rol;
  const puedeEditar = rol === 'administrador' || rol === 'administrativo';

  const [hojaDeVida, setHojaDeVida] = useState<HojaDeVida | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [nuevaExperiencia, setNuevaExperiencia] = useState<CamposExperiencia>(EXPERIENCIA_VACIA);
  const [guardandoExperiencia, setGuardandoExperiencia] = useState<boolean>(false);
  const [errorExperiencia, setErrorExperiencia] = useState<string | null>(null);

  const [nuevaFormacion, setNuevaFormacion] = useState<CamposFormacion>(FORMACION_VACIA);
  const [guardandoFormacion, setGuardandoFormacion] = useState<boolean>(false);
  const [errorFormacion, setErrorFormacion] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    const cargar = async () => {
      setCargando(true);
      setError(null);
      try {
        setHojaDeVida(await apiConsultarHojaDeVida(token, id));
      } catch (err) {
        setError(mensajeDeError(err, 'No se pudo cargar la hoja de vida'));
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [token, id]);

  const cambiarExperiencia =
    (campo: keyof CamposExperiencia) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const valor = e.target.value;
      setNuevaExperiencia((anteriores) => ({ ...anteriores, [campo]: valor }));
    };

  const cambiarFormacion =
    (campo: keyof CamposFormacion) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const valor = e.target.value;
      setNuevaFormacion((anteriores) => ({ ...anteriores, [campo]: valor }));
    };

  const agregarExperiencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;
    setGuardandoExperiencia(true);
    setErrorExperiencia(null);
    try {
      const experiencia = await apiAgregarExperiencia(token, id, {
        empresa: nuevaExperiencia.empresa,
        cargo: nuevaExperiencia.cargo,
        fechaInicio: nuevaExperiencia.fechaInicio,
        fechaFin: nuevaExperiencia.fechaFin || null,
        descripcion: nuevaExperiencia.descripcion.trim() || null,
      });
      setHojaDeVida((hoja) =>
        hoja
          ? {
              ...hoja,
              experiencias: [experiencia, ...hoja.experiencias].sort((a, b) =>
                b.fechaInicio.localeCompare(a.fechaInicio),
              ),
            }
          : hoja,
      );
      setNuevaExperiencia(EXPERIENCIA_VACIA);
    } catch (err) {
      setErrorExperiencia(mensajeDeError(err, 'No se pudo agregar la experiencia'));
    } finally {
      setGuardandoExperiencia(false);
    }
  };

  const agregarFormacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;
    setGuardandoFormacion(true);
    setErrorFormacion(null);
    try {
      const formacion = await apiAgregarFormacion(token, id, {
        tipo: nuevaFormacion.tipo,
        titulo: nuevaFormacion.titulo,
        institucion: nuevaFormacion.institucion,
        fechaObtencion: nuevaFormacion.fechaObtencion,
        fechaVencimiento: nuevaFormacion.fechaVencimiento || null,
      });
      setHojaDeVida((hoja) =>
        hoja
          ? {
              ...hoja,
              formaciones: [formacion, ...hoja.formaciones].sort((a, b) =>
                b.fechaObtencion.localeCompare(a.fechaObtencion),
              ),
            }
          : hoja,
      );
      setNuevaFormacion(FORMACION_VACIA);
    } catch (err) {
      setErrorFormacion(mensajeDeError(err, 'No se pudo agregar la formación'));
    } finally {
      setGuardandoFormacion(false);
    }
  };

  if (cargando) {
    return <p>Cargando hoja de vida...</p>;
  }

  if (!hojaDeVida) {
    return (
      <div>
        {error && (
          <div className="alerta alerta-error" role="alert">
            {error}
          </div>
        )}
        <Link to="/operarios" className="btn">
          Volver a la lista
        </Link>
      </div>
    );
  }

  const { operario, experiencias, formaciones = [] } = hojaDeVida;  const incompleta =
    !operario.eps ||
    !operario.arl ||
    !operario.contactoEmergenciaNombre ||
    !operario.fechaNacimiento ||
    operario.especialidades.length === 0;
  const certificacionesVencidas = formaciones.filter((f) => f.tipo === 'certificacion' && !f.vigente);

  const columnasExperiencia: Columna<ExperienciaLaboral>[] = [
    { key: 'empresa', encabezado: 'Empresa', render: (x: ExperienciaLaboral) => x.empresa },
    { key: 'cargo', encabezado: 'Cargo', render: (x: ExperienciaLaboral) => x.cargo },
    {
      key: 'fechaInicio',
      encabezado: 'Periodo',
      render: (x: ExperienciaLaboral) => `${x.fechaInicio} — ${x.fechaFin ?? 'Actualidad'}`,
    },
    {
      key: 'descripcion',
      encabezado: 'Descripción',
      render: (x: ExperienciaLaboral) => x.descripcion || '—',
    },
  ];

  const columnasFormacion: Columna<Formacion>[] = [
    { key: 'tipo', encabezado: 'Tipo', render: (f: Formacion) => nombreTipoFormacion(f.tipo) },
    { key: 'titulo', encabezado: 'Título', render: (f: Formacion) => f.titulo },
    { key: 'institucion', encabezado: 'Institución', render: (f: Formacion) => f.institucion },
    { key: 'fechaObtencion', encabezado: 'Obtenido', render: (f: Formacion) => f.fechaObtencion },
    {
      key: 'fechaVencimiento',
      encabezado: 'Vence',
      render: (f: Formacion) => f.fechaVencimiento ?? 'No vence',
    },
    {
      key: 'vigente',
      encabezado: 'Estado',
      render: (f: Formacion) =>
        f.vigente ? (
          <span className="chip-normal">Vigente</span>
        ) : (
          <span className="chip-revisar">Vencida</span>
        ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <h2 className="titulo-pagina">
          {operario.nombreCompleto}{' '}
          {operario.activo ? (
            <span className="chip-normal">Activo</span>
          ) : (
            <span className="chip-revisar">Inactivo</span>
          )}
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/operarios" className="btn">
            Volver
          </Link>
          {puedeEditar && (
            <Link to={`/operarios/${operario.id}/editar`} className="btn btn-primario">
              Editar datos
            </Link>
          )}
        </div>
      </div>

      {incompleta && (
        <div className="alerta alerta-aviso" role="alert">
          Hoja de vida incompleta: faltan datos personales, laborales, de salud o de emergencia.
          {puedeEditar && ' Usa "Editar datos" para completarla.'}
        </div>
      )}

      {certificacionesVencidas.length > 0 && (
        <div className="alerta alerta-error" role="alert">
          Certificaciones vencidas: {certificacionesVencidas.map((f) => f.titulo).join(', ')}.
        </div>
      )}

      <div className="tarjeta">
        <h3 className="tarjeta-titulo">Datos personales</h3>
        <div style={GRILLA}>
          <Dato
            etiqueta="Tipo de documento"
            valor={TIPOS_DOCUMENTO.find((t) => t.valor === operario.tipoDocumento)?.nombre ?? operario.tipoDocumento}
          />
          <Dato etiqueta="Número de documento" valor={operario.documentoIdentidad} />
          <Dato
            etiqueta="Fecha de nacimiento"
            valor={operario.fechaNacimiento ? `${operario.fechaNacimiento} (${operario.edad} años)` : null}
          />
          <Dato etiqueta="Teléfono" valor={operario.telefono} />
          <Dato etiqueta="Dirección" valor={operario.direccion} />
        </div>
      </div>

      <div className="tarjeta" style={{ marginTop: '16px' }}>
        <h3 className="tarjeta-titulo">Datos laborales</h3>
        <div style={GRILLA}>
          <Dato etiqueta="Cargo" valor={operario.cargo} />
          <Dato etiqueta="Fecha de ingreso" valor={operario.fechaIngreso} />
          <Dato etiqueta="Especialidades" valor={operario.especialidades.map(nombreEspecialidad).join(', ')} />
        </div>
      </div>

      <div className="tarjeta" style={{ marginTop: '16px' }}>
        <h3 className="tarjeta-titulo">Salud y emergencia</h3>
        <div style={GRILLA}>
          <Dato etiqueta="Tipo de sangre" valor={operario.tipoSangre} />
          <Dato etiqueta="EPS" valor={operario.eps} />
          <Dato etiqueta="ARL" valor={operario.arl} />
          <Dato etiqueta="Contacto de emergencia" valor={operario.contactoEmergenciaNombre} />
          <Dato etiqueta="Teléfono del contacto" valor={operario.contactoEmergenciaTelefono} />
        </div>
      </div>

      <div className="tarjeta" style={{ marginTop: '16px' }}>
        <h3 className="tarjeta-titulo">Formación y certificaciones ({formaciones.length})</h3>
        <Tabla<Formacion>
          columnas={columnasFormacion}
          filas={[...formaciones]}
          claveFila={(f: Formacion) => f.id}
          mensajeVacio="Este operario no tiene formación registrada"
        />
      </div>

      {puedeEditar && (
        <div className="tarjeta" style={{ marginTop: '16px' }}>
          <form className="formulario" onSubmit={agregarFormacion}>
            <h3 className="tarjeta-titulo">Agregar formación</h3>
            <div style={DOS_COLUMNAS}>
              <div className="campo">
                <label htmlFor="form-tipo">Tipo</label>
                <select id="form-tipo" value={nuevaFormacion.tipo} onChange={cambiarFormacion('tipo')}>
                  {TIPOS_FORMACION.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="form-titulo">Título</label>
                <input id="form-titulo" value={nuevaFormacion.titulo} onChange={cambiarFormacion('titulo')} required maxLength={150} />
              </div>
              <div className="campo">
                <label htmlFor="form-institucion">Institución</label>
                <input id="form-institucion" value={nuevaFormacion.institucion} onChange={cambiarFormacion('institucion')} required maxLength={150} />
              </div>
              <div className="campo">
                <label htmlFor="form-obtencion">Fecha de obtención</label>
                <input
                  id="form-obtencion"
                  type="date"
                  value={nuevaFormacion.fechaObtencion}
                  onChange={cambiarFormacion('fechaObtencion')}
                  max={fechaHoyColombia()}
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="form-vencimiento">Fecha de vencimiento (vacía si no vence)</label>
                <input
                  id="form-vencimiento"
                  type="date"
                  value={nuevaFormacion.fechaVencimiento}
                  onChange={cambiarFormacion('fechaVencimiento')}
                  min={nuevaFormacion.fechaObtencion || undefined}
                />
              </div>
            </div>

            {errorFormacion && (
              <div className="alerta alerta-error" role="alert">
                {errorFormacion}
              </div>
            )}

            <button type="submit" className="btn btn-primario" disabled={guardandoFormacion}>
              {guardandoFormacion ? 'Guardando...' : 'Agregar formación'}
            </button>
          </form>
        </div>
      )}

      <div className="tarjeta" style={{ marginTop: '16px' }}>
        <h3 className="tarjeta-titulo">Experiencia laboral ({experiencias.length})</h3>
        <Tabla<ExperienciaLaboral>
          columnas={columnasExperiencia}
          filas={[...experiencias]}
          claveFila={(x: ExperienciaLaboral) => x.id}
          mensajeVacio="Este operario no tiene experiencia laboral registrada"
        />
      </div>

      {puedeEditar && (
        <div className="tarjeta" style={{ marginTop: '16px' }}>
          <form className="formulario" onSubmit={agregarExperiencia}>
            <h3 className="tarjeta-titulo">Agregar experiencia laboral</h3>
            <div style={DOS_COLUMNAS}>
              <div className="campo">
                <label htmlFor="exp-empresa">Empresa</label>
                <input id="exp-empresa" value={nuevaExperiencia.empresa} onChange={cambiarExperiencia('empresa')} required maxLength={150} />
              </div>
              <div className="campo">
                <label htmlFor="exp-cargo">Cargo</label>
                <input id="exp-cargo" value={nuevaExperiencia.cargo} onChange={cambiarExperiencia('cargo')} required maxLength={100} />
              </div>
              <div className="campo">
                <label htmlFor="exp-inicio">Fecha de inicio</label>
                <input
                  id="exp-inicio"
                  type="date"
                  value={nuevaExperiencia.fechaInicio}
                  onChange={cambiarExperiencia('fechaInicio')}
                  max={fechaHoyColombia()}
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="exp-fin">Fecha de finalización (vacía si aún trabaja allí)</label>
                <input
                  id="exp-fin"
                  type="date"
                  value={nuevaExperiencia.fechaFin}
                  onChange={cambiarExperiencia('fechaFin')}
                  min={nuevaExperiencia.fechaInicio || undefined}
                />
              </div>
            </div>
            <div className="campo">
              <label htmlFor="exp-descripcion">Descripción (opcional)</label>
              <textarea
                id="exp-descripcion"
                value={nuevaExperiencia.descripcion}
                onChange={cambiarExperiencia('descripcion')}
                rows={3}
              />
            </div>

            {errorExperiencia && (
              <div className="alerta alerta-error" role="alert">
                {errorExperiencia}
              </div>
            )}

            <button type="submit" className="btn btn-primario" disabled={guardandoExperiencia}>
              {guardandoExperiencia ? 'Guardando...' : 'Agregar experiencia'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}