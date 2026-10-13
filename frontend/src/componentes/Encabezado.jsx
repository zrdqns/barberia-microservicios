// Título de la sección, una línea que la explica y, a la derecha, su acción principal.
export default function Encabezado({ titulo, descripcion, children }) {
  return (
    <header className="encabezado">
      <div>
        <h1>{titulo}</h1>
        <p>{descripcion}</p>
      </div>
      {children && <div className="encabezado-acciones">{children}</div>}
    </header>
  )
}

// Lo que se ve cuando una lista no tiene nada que mostrar: qué pasa y qué hacer.
export function Vacio({ titulo, children }) {
  return (
    <div className="vacio">
      <strong>{titulo}</strong>
      <div className="vacio-texto">{children}</div>
    </div>
  )
}
