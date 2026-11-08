// Componente de tabla reutilizable y responsiva para listados y datos tabulares
import React from 'react';

export interface Columna<T> {
  readonly key: string;
  readonly encabezado: string;
  readonly render?: (fila: T, index: number) => React.ReactNode;
}

export interface TablaProps<T> {
  readonly columnas: readonly Columna<T>[];
  readonly filas: readonly T[];
  readonly claveFila: (fila: T, index: number) => string | number;
  readonly mensajeVacio?: string;
}

export function Tabla<T>({
  columnas,
  filas,
  claveFila,
  mensajeVacio = 'No hay registros para mostrar',
}: TablaProps<T>) {
  if (filas.length === 0) {
    return (
      <div className="alerta alerta-aviso texto-centrado" role="status">
        {mensajeVacio}
      </div>
    );
  }

  return (
    <div className="tabla-contenedor">
      <table>
        <thead>
          <tr>
            {columnas.map((col) => (
              <th key={col.key} scope="col">
                {col.encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={claveFila(fila, i)}>
              {columnas.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(fila, i) : String((fila as Record<string, unknown>)[col.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
