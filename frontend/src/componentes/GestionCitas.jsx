import { useState } from 'react'
import { citas } from '../api.js'
import { paraCampoFecha } from '../formato.js'
import { useAvisos } from './Avisos.jsx'
import { FichaCita } from './Boleta.jsx'
import Confirmacion from './Confirmacion.jsx'
import FormularioCita from './FormularioCita.jsx'

const CONFIRMACIONES = {
  completar: {
    titulo: 'Completar cita',
    accion: 'Completar cita',
    tono: 'normal',
    hecho: 'Cita completada',
    texto: 'La cita quedará como completada y ya no se podrá modificar.',
  },
  cancelar: {
    titulo: 'Cancelar cita',
    accion: 'Cancelar cita',
    tono: 'peligro',
    hecho: 'Cita cancelada',
    texto: 'La cita seguirá en la lista como cancelada y el horario del barbero quedará libre.',
  },
  eliminar: {
    titulo: 'Eliminar cita',
    accion: 'Eliminar',
    tono: 'peligro',
    hecho: 'Cita eliminada',
    texto: 'La cita se borrará de la lista. Esta acción no se puede deshacer.',
  },
}

// Todo lo que se hace con una cita: agendar, editar, completar, cancelar y eliminar.
// Inicio y Citas lo comparten. `ventanas` es lo que hay que pintar para que el
// formulario y las confirmaciones aparezcan; `alCambiar` vuelve a pedir la lista.
export function useGestionCitas(alCambiar) {
  const avisar = useAvisos()

  // null: cerrado · sin id: cita nueva (puede traer barbero y fecha) · con id: en edición
  const [enFormulario, setEnFormulario] = useState(null)
  // Acción por confirmar: { tipo: 'completar' | 'cancelar' | 'eliminar', cita }
  const [pendiente, setPendiente] = useState(null)

  // Si la API rechaza la acción, el error sale de aquí y la confirmación lo muestra
  async function ejecutar() {
    const { tipo, cita } = pendiente
    if (tipo === 'eliminar') await citas.eliminar(cita.id)
    else await citas.cambiarEstado(cita.id, tipo === 'completar' ? 'COMPLETADA' : 'CANCELADA')
    avisar('exito', CONFIRMACIONES[tipo].hecho)
    await alCambiar()
    setPendiente(null)
  }

  const confirmacion = pendiente && CONFIRMACIONES[pendiente.tipo]

  const ventanas = (
    <>
      {enFormulario && (
        <FormularioCita
          cita={enFormulario}
          alCerrar={() => setEnFormulario(null)}
          alGuardar={async (mensaje) => {
            setEnFormulario(null)
            avisar('exito', mensaje)
            await alCambiar()
          }}
        />
      )}

      {pendiente && (
        <Confirmacion
          titulo={confirmacion.titulo}
          accion={confirmacion.accion}
          tono={confirmacion.tono}
          alConfirmar={ejecutar}
          alCerrar={() => setPendiente(null)}
        >
          <FichaCita cita={pendiente.cita} />
          <p>{confirmacion.texto}</p>
          {pendiente.tipo === 'completar' && pendiente.cita.fechaHora.slice(0, 16) > paraCampoFecha() && (
            <p className="nota-aviso">Esta cita todavía no ha empezado.</p>
          )}
        </Confirmacion>
      )}
    </>
  )

  return {
    agendar: (previo = {}) => setEnFormulario(previo),
    editar: (cita) => setEnFormulario(cita),
    completar: (cita) => setPendiente({ tipo: 'completar', cita }),
    cancelar: (cita) => setPendiente({ tipo: 'cancelar', cita }),
    eliminar: (cita) => setPendiente({ tipo: 'eliminar', cita }),
    ventanas,
  }
}
