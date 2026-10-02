import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

// Ventana modal sobre el elemento <dialog> del navegador,
// que ya resuelve el foco y el cierre con la tecla Escape.
export default function Modal({ titulo, angosta = false, alCerrar, children }) {
  const referencia = useRef(null)

  useEffect(() => {
    const dialogo = referencia.current
    dialogo.showModal()
    return () => dialogo.close()
  }, [])

  return (
    <dialog
      ref={referencia}
      className={angosta ? 'modal angosta' : 'modal'}
      onCancel={(evento) => {
        evento.preventDefault()
        alCerrar()
      }}
    >
      <div className="modal-cabecera">
        <h2>{titulo}</h2>
        <button type="button" className="modal-cerrar" aria-label="Cerrar" onClick={alCerrar}>
          <X aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  )
}
