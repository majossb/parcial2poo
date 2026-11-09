// Pantalla con la hoja de vida de un operario: datos personales, laborales, de salud y experiencia (RF-03, RF-05)
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Tabla, type Columna } from '../../../shared/components/Tabla.js';
import { fechaHoyColombia } from '../../../shared/utils/fechas.js';
import { useSesion } from '../../auth/hooks/useSesion.js';
import { apiAgregarExperiencia, apiConsultarHojaDeVida } from '../api/hojas-de-vida.api.js';
import { mensajeDeError } from '../errores.js';
import { TIPOS_DOCUMENTO, nombreEspecialidad, type ExperienciaLaboral, type HojaDeVida } from '../types.js';




interface CamposExperiencia {
  empresa: string;
  cargo: string;
  fechaInicio: string;
  fechaFin: string;
  descripcion: string;
}

const EXPERIENCIA_VACIA: CamposExperiencia = {
  empresa: '',
  cargo: '',
  fechaInicio: '',
  fechaFin: '',
  descripcion: '',
};

const GRILLA: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '16px',
};

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

  const [nueva, setNueva] = useState<CamposExperiencia>(EXPERIENCIA_VACIA);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [errorExperiencia, setErrorExperiencia] = useState<string | null>(null);

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

  const cambiar =
    (campo: keyof CamposExperiencia) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const valor = e.target.value;
      setNueva((anteriores) => ({ ...anteriores, [campo]: valor }));
    };

  const agregarExperiencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;
    setGuardando(true);
    setErrorExperiencia(null);
    try {
      const experiencia = await apiAgregarExperiencia(token, id, {
        empresa: nueva.empresa,
        cargo: nueva.cargo,
        fechaInicio: nueva.fechaInicio,
        fechaFin: nueva.fechaFin || null,
        descripcion: nueva.descripcion.trim() || null,
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
      setNueva(EXPERIENCIA_VACIA);
    } catch (err) {
      setErrorExperiencia(mensajeDeError(err, 'No se pudo agregar la experiencia'));
    } finally {
      setGuardando(false);
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

  const { operario, experiencias } = hojaDeVida;
  const incompleta =
    !operario.eps || !operario.arl || !operario.contactoEmergenciaNombre || !operario.fechaNacimiento || operario.especialidades.length === 0;
  const columnas: Columna<ExperienciaLaboral>[] = [
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
          Hoja de vida incompleta: faltan datos personales, de salud o de emergencia.
          {puedeEditar && ' Usa "Editar datos" para completarla.'}
        </div>
      )}

      <div className="tarjeta">
        <h3 className="tarjeta-titulo">Datos personales</h3>
        <div style={GRILLA}>
                  <Dato etiqueta="Tipo de documento" valor={TIPOS_DOCUMENTO.find((t) => t.valor === operario.tipoDocumento)?.nombre ?? operario.tipoDocumento} />
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
          <Dato etiqueta="Especialidades" valor={operario.especialidades.map(nombreEspecialidad).join(', ')} />       </div>
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
        <h3 className="tarjeta-titulo">Experiencia laboral ({experiencias.length})</h3>
        <Tabla<ExperienciaLaboral>
          columnas={columnas}
          filas={[...experiencias]}
          claveFila={(x: ExperienciaLaboral) => x.id}
          mensajeVacio="Este operario no tiene experiencia laboral registrada"
        />
      </div>

      {puedeEditar && (
        <div className="tarjeta" style={{ marginTop: '16px' }}>
          <form className="formulario" onSubmit={agregarExperiencia}>
            <h3 className="tarjeta-titulo">Agregar experiencia laboral</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="campo">
                <label htmlFor="exp-empresa">Empresa</label>
                <input id="exp-empresa" value={nueva.empresa} onChange={cambiar('empresa')} required maxLength={150} />
              </div>
              <div className="campo">
                <label htmlFor="exp-cargo">Cargo</label>
                <input id="exp-cargo" value={nueva.cargo} onChange={cambiar('cargo')} required maxLength={100} />
              </div>
              <div className="campo">
                <label htmlFor="exp-inicio">Fecha de inicio</label>
                <input
                  id="exp-inicio"
                  type="date"
                  value={nueva.fechaInicio}
                  onChange={cambiar('fechaInicio')}
                  max={fechaHoyColombia()}
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="exp-fin">Fecha de finalización (vacía si aún trabaja allí)</label>
                <input
                  id="exp-fin"
                  type="date"
                  value={nueva.fechaFin}
                  onChange={cambiar('fechaFin')}
                  min={nueva.fechaInicio || undefined}
                />
              </div>
            </div>
            <div className="campo">
              <label htmlFor="exp-descripcion">Descripción (opcional)</label>
              <textarea
                id="exp-descripcion"
                value={nueva.descripcion}
                onChange={cambiar('descripcion')}
                rows={3}
              />
            </div>

            {errorExperiencia && (
              <div className="alerta alerta-error" role="alert">
                {errorExperiencia}
              </div>
            )}

            <button type="submit" className="btn btn-primario" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Agregar experiencia'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
