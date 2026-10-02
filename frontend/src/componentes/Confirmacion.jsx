import { useState } from 'react'
import Modal from './Modal.jsx'

// Pide confirmación antes de una acción que no se puede deshacer.
export default function Confirmacion({ titulo, mensaje, accion, peligro = true, alConfirmar, alCerrar }) {
  const [enviando, setEnviando] = useState(false)

  async function confirmar() {
    setEnviando(true)
    await alConfirmar()
  }

  return (
    <Modal titulo={titulo} angosta alCerrar={alCerrar}>
      <div className="modal-cuerpo">
        <p>{mensaje}</p>
      </div>
      <div className="modal-pie">
        <button type="button" className="boton" onClick={alCerrar}>
          Volver
        </button>
        <button
          type="button"
          className={peligro ? 'boton boton-peligro' : 'boton boton-primario'}
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
