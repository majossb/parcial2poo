// Formulario para registrar un operario nuevo o editar su hoja de vida (RF-02, RF-03)
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fechaHoyColombia } from '../../../shared/utils/fechas.js';
import { useSesion } from '../../auth/hooks/useSesion.js';
import {
  apiActualizarOperario,
  apiConsultarHojaDeVida,
  apiRegistrarOperario,
} from '../api/hojas-de-vida.api.js';
import { mensajeDeError } from '../errores.js';
import { ESPECIALIDADES, TIPOS_DOCUMENTO, TIPOS_SANGRE, type DatosOperario } from '../types.js';

interface Campos {
  tipoDocumento: string;
  documentoIdentidad: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  telefono: string;
  direccion: string;
  cargo: string;
  fechaIngreso: string;
  especialidades: string[];
  tipoSangre: string;
  eps: string;
  arl: string;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTelefono: string;
  correo: string;
  contrasenaInicial: string;
}

// Todos los campos que se escriben como texto (es decir, todos menos las especialidades)
type CampoTexto = Exclude<keyof Campos, 'especialidades'>;

const CAMPOS_VACIOS: Campos = {
  tipoDocumento: 'CC',
  documentoIdentidad: '',
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  telefono: '',
  direccion: '',
  cargo: '',
  fechaIngreso: '',
  especialidades: [],
  tipoSangre: '',
  eps: '',
  arl: '',
  contactoEmergenciaNombre: '',
  contactoEmergenciaTelefono: '',
  correo: '',
  contrasenaInicial: '',
};

const DOS_COLUMNAS: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };

function Campo({
  id,
  etiqueta,
  ...props
}: { id: string; etiqueta: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input id={id} {...props} />
    </div>
  );
}

const textoONulo = (valor: string) => valor.trim() || null;

export function FormularioOperario() {
  const { id } = useParams<{ id: string }>();
  const esEdicion = Boolean(id);
  const { sesion } = useSesion();
  const token = sesion?.token;
  const navigate = useNavigate();

  const [campos, setCampos] = useState<Campos>(CAMPOS_VACIOS);
  const [cargando, setCargando] = useState<boolean>(esEdicion);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    const cargar = async () => {
      try {
        const { operario } = await apiConsultarHojaDeVida(token, id);
        setCampos({
          ...CAMPOS_VACIOS,
          tipoDocumento: operario.tipoDocumento,
          documentoIdentidad: operario.documentoIdentidad,
          nombres: operario.nombres,
          apellidos: operario.apellidos,
          fechaNacimiento: operario.fechaNacimiento ?? '',
          telefono: operario.telefono ?? '',
          direccion: operario.direccion ?? '',
          cargo: operario.cargo,
          fechaIngreso: operario.fechaIngreso,
          especialidades: [...operario.especialidades],
          tipoSangre: operario.tipoSangre ?? '',
          eps: operario.eps ?? '',
          arl: operario.arl ?? '',
          contactoEmergenciaNombre: operario.contactoEmergenciaNombre ?? '',
          contactoEmergenciaTelefono: operario.contactoEmergenciaTelefono ?? '',
        });
      } catch (err) {
        setError(mensajeDeError(err, 'No se pudo cargar el operario'));
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [token, id]);

  const cambiar =
    (campo: CampoTexto) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const valor = e.target.value;
      setCampos((anteriores) => ({ ...anteriores, [campo]: valor }));
    };

  // Marca o desmarca una especialidad
  const alternarEspecialidad = (valor: string) => {
    setCampos((anteriores) => ({
      ...anteriores,
      especialidades: anteriores.especialidades.includes(valor)
        ? anteriores.especialidades.filter((e) => e !== valor)
        : [...anteriores.especialidades, valor],
    }));
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (campos.especialidades.length === 0) {
      setError('Selecciona al menos una especialidad');
      return;
    }
    setGuardando(true);
    setError(null);

    const datos: DatosOperario = {
      tipoDocumento: campos.tipoDocumento,
      documentoIdentidad: campos.documentoIdentidad,
      nombres: campos.nombres,
      apellidos: campos.apellidos,
      fechaNacimiento: campos.fechaNacimiento || null,
      telefono: textoONulo(campos.telefono),
      direccion: textoONulo(campos.direccion),
      cargo: campos.cargo,
      fechaIngreso: campos.fechaIngreso,
      especialidades: campos.especialidades,
      tipoSangre: campos.tipoSangre || null,
      eps: textoONulo(campos.eps),
      arl: textoONulo(campos.arl),
      contactoEmergenciaNombre: textoONulo(campos.contactoEmergenciaNombre),
      contactoEmergenciaTelefono: textoONulo(campos.contactoEmergenciaTelefono),
    };

    try {
      const operario = id
        ? await apiActualizarOperario(token, id, datos)
        : await apiRegistrarOperario(token, {
            ...datos,
            correo: campos.correo,
            contrasenaInicial: campos.contrasenaInicial,
          });
      navigate(`/operarios/${operario.id}`);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo guardar el operario'));
      setGuardando(false);
    }
  };

  if (cargando) {
    return <p>Cargando datos del operario...</p>;
  }

  return (
    <div>
      <h2 className="titulo-pagina">{esEdicion ? 'Editar hoja de vida' : 'Registrar operario'}</h2>

      <div className="tarjeta">
        <form className="formulario" onSubmit={guardar}>
          <h3 className="tarjeta-titulo">Datos personales</h3>
          <div style={DOS_COLUMNAS}>
            <div className="campo">
              <label htmlFor="tipo-documento">Tipo de documento</label>
              <select id="tipo-documento" value={campos.tipoDocumento} onChange={cambiar('tipoDocumento')}>
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
            <Campo id="documento" etiqueta="Número de documento" value={campos.documentoIdentidad} onChange={cambiar('documentoIdentidad')} required maxLength={20} />
            <Campo id="nombres" etiqueta="Nombres" value={campos.nombres} onChange={cambiar('nombres')} required maxLength={100} />
            <Campo id="apellidos" etiqueta="Apellidos" value={campos.apellidos} onChange={cambiar('apellidos')} required maxLength={100} />
            <Campo id="fecha-nacimiento" etiqueta="Fecha de nacimiento" type="date" value={campos.fechaNacimiento} onChange={cambiar('fechaNacimiento')} max={fechaHoyColombia()} required />
            <Campo id="telefono" etiqueta="Teléfono (opcional)" type="tel" value={campos.telefono} onChange={cambiar('telefono')} maxLength={20} />
          </div>
          <Campo id="direccion" etiqueta="Dirección (opcional)" value={campos.direccion} onChange={cambiar('direccion')} maxLength={200} />

          <h3 className="tarjeta-titulo">Datos laborales</h3>
          <div style={DOS_COLUMNAS}>
            <Campo id="cargo" etiqueta="Cargo" value={campos.cargo} onChange={cambiar('cargo')} required maxLength={100} />
            <Campo id="fecha-ingreso" etiqueta="Fecha de ingreso" type="date" value={campos.fechaIngreso} onChange={cambiar('fechaIngreso')} max={fechaHoyColombia()} required />
          </div>
          <div className="campo">
            <label>Especialidades (selecciona al menos una)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
              {ESPECIALIDADES.map((e) => (
                <label key={e.valor} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 400, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={campos.especialidades.includes(e.valor)}
                    onChange={() => alternarEspecialidad(e.valor)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  {e.nombre}
                </label>
              ))}
            </div>
          </div>

          <h3 className="tarjeta-titulo">Salud y emergencia</h3>
          <div style={DOS_COLUMNAS}>
            <Campo id="eps" etiqueta="EPS" value={campos.eps} onChange={cambiar('eps')} required maxLength={100} />
            <Campo id="arl" etiqueta="ARL" value={campos.arl} onChange={cambiar('arl')} required maxLength={100} />
            <div className="campo">
              <label htmlFor="tipo-sangre">Tipo de sangre (opcional)</label>
              <select id="tipo-sangre" value={campos.tipoSangre} onChange={cambiar('tipoSangre')}>
                <option value="">-- Sin especificar --</option>
                {TIPOS_SANGRE.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
            <div />
            <Campo id="contacto-nombre" etiqueta="Contacto de emergencia" value={campos.contactoEmergenciaNombre} onChange={cambiar('contactoEmergenciaNombre')} required maxLength={150} />
            <Campo id="contacto-telefono" etiqueta="Teléfono del contacto" type="tel" value={campos.contactoEmergenciaTelefono} onChange={cambiar('contactoEmergenciaTelefono')} required maxLength={20} />
          </div>

          {!esEdicion && (
            <>
              <h3 className="tarjeta-titulo">Cuenta de acceso</h3>
              <div style={DOS_COLUMNAS}>
                <Campo id="correo" etiqueta="Correo institucional" type="email" value={campos.correo} onChange={cambiar('correo')} required />
                <Campo id="contrasena" etiqueta="Contraseña inicial (mínimo 8 caracteres)" type="password" value={campos.contrasenaInicial} onChange={cambiar('contrasenaInicial')} minLength={8} required />
              </div>
            </>
          )}

          {error && (
            <div className="alerta alerta-error" role="alert">
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primario" disabled={guardando}>
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Registrar operario'}
            </button>
            <Link to={esEdicion ? `/operarios/${id}` : '/operarios'} className="btn">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}