import { TriangleAlert } from 'lucide-react'

// Un problema que impide seguir: qué pasó, y debajo, la manera de salir de él.
// Los botones de salida (Reintentar, Comprobar) se pasan en `acciones`.
export default function Alerta({ titulo, acciones, children }) {
  return (
    <div className="alerta" role="alert">
      <TriangleAlert aria-hidden="true" />
      <div className="alerta-texto">
        {titulo && <strong>{titulo}</strong>}
        <span>{children}</span>
      </div>
      {acciones && <div className="alerta-acciones">{acciones}</div>}
    </div>
  )
}
