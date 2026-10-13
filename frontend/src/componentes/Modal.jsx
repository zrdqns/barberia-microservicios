import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

// Ventana modal sobre el elemento <dialog> del navegador, que ya atrapa el foco
// y cierra con la tecla Escape. `tamano` es 'normal' o 'angosta'.
export default function Modal({ titulo, tamano = 'normal', alCerrar, children }) {
  const referencia = useRef(null)
  const idTitulo = useId()

  useEffect(() => {
    const dialogo = referencia.current
    const origen = document.activeElement
    dialogo.showModal()

    // El foco entra al primer campo; en una confirmación, al botón que no cambia nada
    const destino =
      dialogo.querySelector('.modal-cuerpo :is(input, select, textarea):not(:disabled)') ??
      dialogo.querySelector('.modal-pie button')
    destino?.focus()

    return () => {
      dialogo.close()
      // Al cerrar, el foco vuelve a donde estaba. Si ese botón ya no existe (la fila
      // se eliminó) o era un atajo de ratón, queda en el contenido de la página.
      if (origen?.isConnected && !origen.closest('[aria-hidden="true"]')) origen.focus()
      else document.getElementById('contenido')?.focus()
    }
  }, [])

  return (
    <dialog
      ref={referencia}
      className={`modal modal-${tamano}`}
      aria-labelledby={idTitulo}
      onCancel={(evento) => {
        evento.preventDefault()
        alCerrar()
      }}
      // Un clic en el fondo oscuro llega al propio dialog, no a su contenido
      onClick={(evento) => evento.target === evento.currentTarget && alCerrar()}
    >
      <div className="modal-cabecera">
        <h2 id={idTitulo}>{titulo}</h2>
        <button type="button" className="boton-icono" aria-label="Cerrar" onClick={alCerrar}>
          <X aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  )
}
