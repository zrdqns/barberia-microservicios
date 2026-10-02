import { Ban, CalendarPlus, Check, Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { barberos, citas, clientes, servicios } from '../api.js'
import { useAvisos } from '../componentes/Avisos.jsx'
import Campo from '../componentes/Campo.jsx'
import Confirmacion from '../componentes/Confirmacion.jsx'
import { FilasEsqueleto } from '../componentes/Esqueleto.jsx'
import Modal from '../componentes/Modal.jsx'
import { formatoFecha, formatoHora, formatoPesos, paraCampoFecha } from '../formato.js'
import { conMinimo } from '../tiempo.js'

const FILTROS = [
  { valor: 'TODAS', texto: 'Todas' },
  { valor: 'PROGRAMADA', texto: 'Programadas' },
  { valor: 'COMPLETADA', texto: 'Completadas' },
  { valor: 'CANCELADA', texto: 'Canceladas' },
]

const ESTADOS = {
  PROGRAMADA: { texto: 'Programada', color: 'ambar' },
  COMPLETADA: { texto: 'Completada', color: 'verde' },
  CANCELADA: { texto: 'Cancelada', color: 'rojo' },
}

export function EtiquetaEstado({ estado }) {
  return <span className={`etiqueta ${ESTADOS[estado].color}`}>{ESTADOS[estado].texto}</span>
}

export default function Citas() {
  const avisar = useAvisos()

  const [lista, setLista] = useState([])
  // primeraCarga muestra el esqueleto; recargando, la barra sobre la tabla ya visible
  const [primeraCarga, setPrimeraCarga] = useState(true)
  const [recargando, setRecargando] = useState(false)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('TODAS')

  // null: formulario cerrado · {}: cita nueva · {id, ...}: cita en edición
  const [enFormulario, setEnFormulario] = useState(null)
  // Acción pendiente de confirmar: { tipo: 'completar' | 'cancelar' | 'eliminar', cita }
  const [pendiente, setPendiente] = useState(null)

  const cargar = useCallback(async (inicial = false) => {
    if (!inicial) setRecargando(true)
    try {
      const datos = await (inicial ? conMinimo(citas.listar()) : citas.listar())
      datos.sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
      setLista(datos)
      setError('')
    } catch (e) {
      setError(e.message)
    }
    setPrimeraCarga(false)
    setRecargando(false)
  }, [])

  useEffect(() => {
    cargar(true)
  }, [cargar])

  async function ejecutarPendiente() {
    const { tipo, cita } = pendiente
    try {
      if (tipo === 'eliminar') {
        await citas.eliminar(cita.id)
        avisar('exito', 'Cita eliminada')
      } else if (tipo === 'completar') {
        await citas.cambiarEstado(cita.id, 'COMPLETADA')
        avisar('exito', 'Cita completada')
      } else {
        await citas.cambiarEstado(cita.id, 'CANCELADA')
        avisar('exito', 'Cita cancelada')
      }
      await cargar()
    } catch (e) {
      avisar('error', e.message)
    }
    setPendiente(null)
  }

  const visibles = filtro === 'TODAS' ? lista : lista.filter((cita) => cita.estado === filtro)

  return (
    <>
      <header className="encabezado">
        <div>
          <h1>Citas</h1>
          <p>Agenda de la barbería. Cada cita une un cliente, un servicio y un barbero.</p>
        </div>
        <button type="button" className="boton boton-primario" onClick={() => setEnFormulario({})}>
          <CalendarPlus aria-hidden="true" />
          Agendar cita
        </button>
      </header>

      {error && (
        <div className="alerta" role="alert">
          <span>{error}</span>
          <button type="button" className="boton boton-fila" onClick={() => cargar()}>
            Reintentar
          </button>
        </div>
      )}

      <section className="tarjeta" aria-busy={primeraCarga || recargando}>
        {recargando && <div className="barra-carga" />}

        <div className="herramientas">
          <div className="filtros" role="group" aria-label="Filtrar por estado">
            {FILTROS.map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                aria-pressed={filtro === opcion.valor}
                onClick={() => setFiltro(opcion.valor)}
              >
                {opcion.texto}
              </button>
            ))}
          </div>
          <span className="conteo">{primeraCarga ? 'Cargando…' : `${visibles.length} de ${lista.length}`}</span>
        </div>

        {primeraCarga || visibles.length > 0 ? (
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Barbero</th>
                  <th className="numero">Valor</th>
                  <th>Estado</th>
                  <th className="acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {primeraCarga && <FilasEsqueleto columnas={6} filas={4} />}
                {visibles.map((cita, orden) => (
                  <tr key={cita.id} className="fila" style={{ '--orden': orden }}>
                    <td>
                      <span className="dato-principal">{formatoHora(cita.fechaHora)}</span>
                      <span className="dato-menor">{formatoFecha(cita.fechaHora)}</span>
                    </td>
                    <td>{cita.clienteNombre}</td>
                    <td>
                      {cita.servicioNombre}
                      <span className="dato-menor">{cita.duracionMinutos} min</span>
                    </td>
                    <td>{cita.barberoNombre}</td>
                    <td className="numero">{formatoPesos(cita.precio)}</td>
                    <td>
                      <EtiquetaEstado estado={cita.estado} />
                    </td>
                    <td className="acciones">
                      <span className="acciones-fila">
                        {cita.estado === 'PROGRAMADA' && (
                          <>
                            <button
                              type="button"
                              className="boton boton-icono exito"
                              title="Completar"
                              aria-label="Completar"
                              onClick={() => setPendiente({ tipo: 'completar', cita })}
                            >
                              <Check aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="boton boton-icono"
                              title="Editar"
                              aria-label="Editar"
                              onClick={() => setEnFormulario(cita)}
                            >
                              <Pencil aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="boton boton-icono"
                              title="Cancelar cita"
                              aria-label="Cancelar cita"
                              onClick={() => setPendiente({ tipo: 'cancelar', cita })}
                            >
                              <Ban aria-hidden="true" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className="boton boton-icono peligro"
                          title="Eliminar"
                          aria-label="Eliminar"
                          onClick={() => setPendiente({ tipo: 'eliminar', cita })}
                        >
                          <Trash2 aria-hidden="true" />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !error && (
            <div className="vacio">
              {lista.length === 0 ? (
                <>
                  <strong>Aún no hay citas</strong>
                  Agende la primera para verla en esta lista.
                </>
              ) : (
                <>
                  <strong>Sin citas en este estado</strong>
                  Cambie el filtro para ver las demás.
                </>
              )}
            </div>
          )
        )}
      </section>

      {enFormulario && (
        <FormularioCita
          cita={enFormulario}
          alCerrar={() => setEnFormulario(null)}
          alGuardar={async (mensaje) => {
            setEnFormulario(null)
            avisar('exito', mensaje)
            await cargar()
          }}
        />
      )}

      {pendiente?.tipo === 'completar' && (
        <Confirmacion
          titulo="Completar cita"
          mensaje={`Se marcará como completada la cita de ${pendiente.cita.clienteNombre}. Después no se podrá modificar.`}
          accion="Completar cita"
          peligro={false}
          alConfirmar={ejecutarPendiente}
          alCerrar={() => setPendiente(null)}
        />
      )}
      {pendiente?.tipo === 'cancelar' && (
        <Confirmacion
          titulo="Cancelar cita"
          mensaje={`Se cancelará la cita de ${pendiente.cita.clienteNombre} y el horario del barbero quedará libre.`}
          accion="Cancelar cita"
          alConfirmar={ejecutarPendiente}
          alCerrar={() => setPendiente(null)}
        />
      )}
      {pendiente?.tipo === 'eliminar' && (
        <Confirmacion
          titulo="Eliminar cita"
          mensaje={`Se eliminará la cita de ${pendiente.cita.clienteNombre}. Esta acción no se puede deshacer.`}
          accion="Eliminar"
          alConfirmar={ejecutarPendiente}
          alCerrar={() => setPendiente(null)}
        />
      )}
    </>
  )
}

function FormularioCita({ cita, alCerrar, alGuardar }) {
  const esNueva = cita.id === undefined

  // Las opciones vienen de los dos microservicios:
  // clientes de api-citas, servicios y barberos de api-catalogo.
  const [opciones, setOpciones] = useState(null)
  const [valores, setValores] = useState({
    clienteId: cita.clienteId ?? '',
    servicioId: cita.servicioId ?? '',
    barberoId: cita.barberoId ?? '',
    fechaHora: cita.fechaHora?.slice(0, 16) ?? '',
    observaciones: cita.observaciones ?? '',
  })
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    Promise.all([clientes.listar(), servicios.listar(), barberos.listar()])
      .then(([listaClientes, listaServicios, listaBarberos]) => {
        setOpciones({ clientes: listaClientes, servicios: listaServicios, barberos: listaBarberos })
      })
      .catch((e) => setErrorServidor(e.message))
  }, [])

  function cambiar(nombre, valor) {
    setValores((actuales) => ({ ...actuales, [nombre]: valor }))
    setErrores((actuales) => ({ ...actuales, [nombre]: '' }))
  }

  async function guardar(evento) {
    evento.preventDefault()

    const encontrados = {}
    if (!valores.clienteId) encontrados.clienteId = 'Seleccione el cliente.'
    if (!valores.servicioId) encontrados.servicioId = 'Seleccione el servicio.'
    if (!valores.barberoId) encontrados.barberoId = 'Seleccione el barbero.'
    if (!valores.fechaHora) encontrados.fechaHora = 'Indique la fecha y la hora.'
    else if (valores.fechaHora < paraCampoFecha()) encontrados.fechaHora = 'La fecha no puede estar en el pasado.'
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return

    // Solo se envían los IDs: api-citas busca el servicio y el barbero en api-catalogo
    const datos = {
      clienteId: Number(valores.clienteId),
      servicioId: Number(valores.servicioId),
      barberoId: Number(valores.barberoId),
      fechaHora: valores.fechaHora,
      observaciones: valores.observaciones,
    }

    setEnviando(true)
    setErrorServidor('')
    try {
      if (esNueva) {
        await citas.crear(datos)
        await alGuardar('Cita agendada')
      } else {
        await citas.actualizar(cita.id, datos)
        await alGuardar('Cita actualizada')
      }
    } catch (e) {
      setErrorServidor(e.message)
      setEnviando(false)
    }
  }

  const servicioElegido = opciones?.servicios.find((servicio) => servicio.id === Number(valores.servicioId))

  return (
    <Modal titulo={esNueva ? 'Agendar cita' : 'Editar cita'} alCerrar={alCerrar}>
      <form onSubmit={guardar} noValidate>
        <div className="modal-cuerpo formulario">
          {errorServidor && (
            <div className="alerta" role="alert">
              {errorServidor}
            </div>
          )}

          <Campo id="cita-cliente" etiqueta="Cliente" error={errores.clienteId} completo>
            <select
              id="cita-cliente"
              value={valores.clienteId}
              disabled={!opciones}
              onChange={(evento) => cambiar('clienteId', evento.target.value)}
            >
              <option value="">{opciones ? 'Seleccione un cliente' : 'Cargando…'}</option>
              {opciones?.clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} · {cliente.documento}
                </option>
              ))}
            </select>
          </Campo>

          <Campo id="cita-servicio" etiqueta="Servicio" error={errores.servicioId}>
            <select
              id="cita-servicio"
              value={valores.servicioId}
              disabled={!opciones}
              onChange={(evento) => cambiar('servicioId', evento.target.value)}
            >
              <option value="">{opciones ? 'Seleccione un servicio' : 'Cargando…'}</option>
              {opciones?.servicios.map((servicio) => (
                <option key={servicio.id} value={servicio.id} disabled={!servicio.activo}>
                  {servicio.nombre}
                  {servicio.activo ? '' : ' (inactivo)'}
                </option>
              ))}
            </select>
          </Campo>

          <Campo id="cita-barbero" etiqueta="Barbero" error={errores.barberoId}>
            <select
              id="cita-barbero"
              value={valores.barberoId}
              disabled={!opciones}
              onChange={(evento) => cambiar('barberoId', evento.target.value)}
            >
              <option value="">{opciones ? 'Seleccione un barbero' : 'Cargando…'}</option>
              {opciones?.barberos.map((barbero) => (
                <option key={barbero.id} value={barbero.id} disabled={!barbero.activo}>
                  {barbero.nombre}
                  {barbero.activo ? '' : ' (inactivo)'}
                </option>
              ))}
            </select>
          </Campo>

          {servicioElegido && (
            <div className="resumen-servicio">
              <span>
                Duración: <strong>{servicioElegido.duracionMinutos} min</strong>
              </span>
              <span>
                Valor: <strong>{formatoPesos(servicioElegido.precio)}</strong>
              </span>
            </div>
          )}

          <Campo id="cita-fecha" etiqueta="Fecha y hora" error={errores.fechaHora} completo>
            <input
              id="cita-fecha"
              type="datetime-local"
              min={paraCampoFecha()}
              value={valores.fechaHora}
              onChange={(evento) => cambiar('fechaHora', evento.target.value)}
            />
          </Campo>

          <Campo id="cita-observaciones" etiqueta="Observaciones" opcional completo>
            <textarea
              id="cita-observaciones"
              value={valores.observaciones}
              onChange={(evento) => cambiar('observaciones', evento.target.value)}
            />
          </Campo>
        </div>

        <div className="modal-pie">
          <button type="button" className="boton" onClick={alCerrar}>
            Cancelar
          </button>
          <button type="submit" className="boton boton-primario" disabled={enviando || !opciones} aria-busy={enviando}>
            {esNueva ? 'Agendar cita' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
