// Formulario para registrar un operario nuevo o editar sus datos (RF-02, RF-03)
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
import type { DatosOperario } from '../types.js';

// En el formulario todo se maneja como texto; al enviar se convierte
interface Campos {
  documentoIdentidad: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  direccion: string;
  cargo: string;
  fechaIngreso: string;
  correo: string;
  contrasenaInicial: string;
}

const CAMPOS_VACIOS: Campos = {
  documentoIdentidad: '',
  nombres: '',
  apellidos: '',
  telefono: '',
  direccion: '',
  cargo: '',
  fechaIngreso: '',
  correo: '',
  contrasenaInicial: '',
};

// Un campo con su etiqueta, para no repetir el mismo bloque muchas veces
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

  // Al editar, se cargan los datos actuales del operario
  useEffect(() => {
    if (!token || !id) return;
    const cargar = async () => {
      try {
        const { operario } = await apiConsultarHojaDeVida(token, id);
        setCampos({
          ...CAMPOS_VACIOS,
          documentoIdentidad: operario.documentoIdentidad,
          nombres: operario.nombres,
          apellidos: operario.apellidos,
          telefono: operario.telefono ?? '',
          direccion: operario.direccion ?? '',
          cargo: operario.cargo,
          fechaIngreso: operario.fechaIngreso,
        });
      } catch (err) {
        setError(mensajeDeError(err, 'No se pudo cargar el operario'));
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [token, id]);

  const cambiar = (campo: keyof Campos) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setCampos((anteriores) => ({ ...anteriores, [campo]: valor }));
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setGuardando(true);
    setError(null);

    const datos: DatosOperario = {
      documentoIdentidad: campos.documentoIdentidad,
      nombres: campos.nombres,
      apellidos: campos.apellidos,
      telefono: campos.telefono.trim() || null,
      direccion: campos.direccion.trim() || null,
      cargo: campos.cargo,
      fechaIngreso: campos.fechaIngreso,
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
      <h2 className="titulo-pagina">{esEdicion ? 'Editar operario' : 'Registrar operario'}</h2>

      <div className="tarjeta">
        <form className="formulario" onSubmit={guardar}>
          <h3 className="tarjeta-titulo">Datos personales</h3>
          <Campo
            id="documento"
            etiqueta="Documento de identidad"
            value={campos.documentoIdentidad}
            onChange={cambiar('documentoIdentidad')}
            required
            maxLength={20}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Campo
              id="nombres"
              etiqueta="Nombres"
              value={campos.nombres}
              onChange={cambiar('nombres')}
              required
              maxLength={100}
            />
            <Campo
              id="apellidos"
              etiqueta="Apellidos"
              value={campos.apellidos}
              onChange={cambiar('apellidos')}
              required
              maxLength={100}
            />
          </div>
          <Campo
            id="telefono"
            etiqueta="Teléfono (opcional)"
            type="tel"
            value={campos.telefono}
            onChange={cambiar('telefono')}
            maxLength={20}
          />
          <Campo
            id="direccion"
            etiqueta="Dirección (opcional)"
            value={campos.direccion}
            onChange={cambiar('direccion')}
            maxLength={200}
          />

          <h3 className="tarjeta-titulo">Datos laborales</h3>
          <Campo
            id="cargo"
            etiqueta="Cargo"
            value={campos.cargo}
            onChange={cambiar('cargo')}
            required
            maxLength={100}
          />
          <Campo
            id="fecha-ingreso"
            etiqueta="Fecha de ingreso"
            type="date"
            value={campos.fechaIngreso}
            onChange={cambiar('fechaIngreso')}
            max={fechaHoyColombia()}
            required
          />

          {!esEdicion && (
            <>
              <h3 className="tarjeta-titulo">Cuenta de acceso</h3>
              <Campo
                id="correo"
                etiqueta="Correo institucional"
                type="email"
                value={campos.correo}
                onChange={cambiar('correo')}
                required
              />
              <Campo
                id="contrasena"
                etiqueta="Contraseña inicial (mínimo 8 caracteres)"
                type="password"
                value={campos.contrasenaInicial}
                onChange={cambiar('contrasenaInicial')}
                minLength={8}
                required
              />
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