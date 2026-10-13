import { useRef, useState } from 'react'
import Alerta from './Alerta.jsx'
import Modal from './Modal.jsx'

// Pide confirmación antes de una acción. El contenido dice qué va a pasar y
// con qué registro. `tono` es 'peligro' (eliminar, cancelar) o 'normal'.
// Si la acción falla, el motivo queda escrito aquí mismo hasta que alguien lo lea.
export default function Confirmacion({ titulo, accion, tono = 'peligro', alConfirmar, alCerrar, children }) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const volver = useRef(null)

  async function confirmar() {
    setEnviando(true)
    setError('')
    try {
      await alConfirmar()
    } catch (e) {
      setError(e.message)
      setEnviando(false)
      // El botón que se pulsó estuvo apagado y perdió el foco: se deja en la salida
      volver.current?.focus()
    }
  }

  return (
    <Modal titulo={titulo} tamano="angosta" alCerrar={alCerrar}>
      <div className="modal-cuerpo">
        {children}
        {error && <Alerta titulo="No se hizo el cambio">{error}</Alerta>}
      </div>
      <div className="modal-pie">
        <button type="button" className="boton" ref={volver} onClick={alCerrar}>
          Volver
        </button>
        <button
          type="button"
          className={tono === 'peligro' ? 'boton boton-peligro' : 'boton boton-primario'}
          disabled={enviando}
          aria-busy={enviando}
          onClick={confirmar}
        >
          {accion}
        </button>
      </div>
    </Modal>
  )
}
