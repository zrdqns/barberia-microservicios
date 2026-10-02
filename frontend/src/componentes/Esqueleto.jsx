// Marcadores de posición que se muestran mientras llegan los datos.
// Tienen la misma forma que el contenido real para que la pantalla no salte.

export function Esqueleto({ ancho = '100%', clase = '' }) {
  return <span className={`esqueleto ${clase}`} style={{ width: ancho }} aria-hidden="true" />
}

// Anchos distintos por fila para que no parezca una cuadrícula rígida
const ANCHOS = ['72%', '54%', '64%', '46%', '58%']

// Filas de una tabla en carga. `columnas` es la cantidad de columnas de datos.
export function FilasEsqueleto({ columnas, filas = 5 }) {
  return Array.from({ length: filas }, (_, fila) => (
    <tr key={fila} aria-hidden="true">
      {Array.from({ length: columnas }, (_, columna) => (
        <td key={columna}>
          <Esqueleto ancho={ANCHOS[(fila + columna) % ANCHOS.length]} />
        </td>
      ))}
      <td className="acciones">
        <Esqueleto ancho="74px" clase="pastilla" />
      </td>
    </tr>
  ))
}
