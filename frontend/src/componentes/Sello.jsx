import { Ban, Check, Clock } from 'lucide-react'

// Marca corta de estado. `tono`: 'mostaza', 'ok', 'apagado' o 'alerta'.
// Siempre lleva texto, y los estados de cita además un icono: el color nunca va solo.
export default function Sello({ tono, children }) {
  return <span className={`sello sello-${tono}`}>{children}</span>
}

const ESTADOS = {
  PROGRAMADA: { texto: 'Programada', tono: 'mostaza', Icono: Clock },
  COMPLETADA: { texto: 'Completada', tono: 'ok', Icono: Check },
  CANCELADA: { texto: 'Cancelada', tono: 'apagado', Icono: Ban },
}

export function SelloEstado({ estado }) {
  const { texto, tono, Icono } = ESTADOS[estado]
  return (
    <Sello tono={tono}>
      <Icono aria-hidden="true" />
      {texto}
    </Sello>
  )
}
