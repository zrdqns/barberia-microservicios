import { useEffect, useRef, useState } from 'react'
import Alerta from './Alerta.jsx'
import Modal from './Modal.jsx'

// Ventana con un formulario: los campos van como contenido.
// Si hay cambios sin guardar, cerrar (Escape, la X, Cancelar o el fondo) pregunta antes.
export default function VentanaFormulario({
  titulo,
  textoGuardar,
  enviando,
  bloqueado = false,
  hayCambios,
  error,
  alEnviar,
  alCerrar,
  children,
}) {
  const [porDescartar, setPorDescartar] = useState(false)
  const rechazo = useRef(null)

  // Cuando la API rechaza el envío, el motivo sube a la vista y recibe el foco
  useEffect(() => {
    if (error) rechazo.current?.focus()
  }, [error])

  function cerrar() {
    if (hayCambios && !porDescartar) setPorDescartar(true)
    else alCerrar()
  }

  return (
    <Modal titulo={titulo} alCerrar={cerrar}>
      <form onSubmit={alEnviar} noValidate>
        <div className="modal-cuerpo formulario">
          {error && (
            <div className="completo rechazo" ref={rechazo} tabIndex={-1}>
              <Alerta titulo="No se guardó">{error}</Alerta>
            </div>
          )}
          {children}
        </div>

        {/* Cada pie tiene su clave: sin ella React reutilizaría los botones de uno
            en el otro, y «Seguir editando» terminaría enviando el formulario. */}
        {porDescartar ? (
          <div className="modal-pie" key="pregunta">
            <p className="modal-pregunta" role="alert">
              Hay cambios sin guardar.
            </p>
            <button type="button" className="boton" ref={(boton) => boton?.focus()} onClick={() => setPorDescartar(false)}>
              Seguir editando
            </button>
            <button type="button" className="boton boton-peligro" onClick={alCerrar}>
              Descartar cambios
            </button>
          </div>
        ) : (
          <div className="modal-pie" key="acciones">
            <button type="button" className="boton" onClick={cerrar}>
              Cancelar
            </button>
            <button type="submit" className="boton boton-primario" disabled={enviando || bloqueado} aria-busy={enviando}>
              {enviando ? 'Guardando…' : textoGuardar}
            </button>
          </div>
        )}
      </form>
    </Modal>
  )
}
