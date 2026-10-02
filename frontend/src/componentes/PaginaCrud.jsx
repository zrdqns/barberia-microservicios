import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { conMinimo } from '../tiempo.js'
import { useAvisos } from './Avisos.jsx'
import Campo from './Campo.jsx'
import Confirmacion from './Confirmacion.jsx'
import { FilasEsqueleto } from './Esqueleto.jsx'
import Modal from './Modal.jsx'

// Pantalla de gestión de un recurso: lista, búsqueda, crear, editar y eliminar.
// Clientes, servicios y barberos la reutilizan cambiando solo la configuración.
export default function PaginaCrud({ api, textos, columnas, campos, textoBusqueda }) {
  const avisar = useAvisos()

  const [registros, setRegistros] = useState([])
  // primeraCarga muestra el esqueleto; recargando, la barra sobre la tabla ya visible
  const [primeraCarga, setPrimeraCarga] = useState(true)
  const [recargando, setRecargando] = useState(false)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // null: formulario cerrado · {}: registro nuevo · {id, ...}: registro en edición
  const [enFormulario, setEnFormulario] = useState(null)
  const [porEliminar, setPorEliminar] = useState(null)

  const cargar = useCallback(
    async (inicial = false) => {
      if (!inicial) setRecargando(true)
      try {
        setRegistros(await (inicial ? conMinimo(api.listar()) : api.listar()))
        setError('')
      } catch (e) {
        setError(e.message)
      }
      setPrimeraCarga(false)
      setRecargando(false)
    },
    [api],
  )

  useEffect(() => {
    cargar(true)
  }, [cargar])

  async function eliminar() {
    try {
      await api.eliminar(porEliminar.id)
      avisar('exito', textos.eliminado)
      await cargar()
    } catch (e) {
      avisar('error', e.message)
    }
    setPorEliminar(null)
  }

  const termino = busqueda.trim().toLowerCase()
  const visibles = registros.filter((registro) => textoBusqueda(registro).toLowerCase().includes(termino))

  return (
    <>
      <header className="encabezado">
        <div>
          <h1>{textos.titulo}</h1>
          <p>{textos.descripcion}</p>
        </div>
        <button type="button" className="boton boton-primario" onClick={() => setEnFormulario({})}>
          <Plus aria-hidden="true" />
          {textos.nuevo}
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
          <div className="buscador">
            <Search aria-hidden="true" />
            <input
              type="search"
              placeholder={textos.buscar}
              aria-label={textos.buscar}
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />
          </div>
          <span className="conteo">
            {primeraCarga ? 'Cargando…' : `${visibles.length} de ${registros.length}`}
          </span>
        </div>

        {primeraCarga || visibles.length > 0 ? (
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  {columnas.map((columna) => (
                    <th key={columna.titulo} className={columna.clase}>
                      {columna.titulo}
                    </th>
                  ))}
                  <th className="acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {primeraCarga ? (
                  <FilasEsqueleto columnas={columnas.length} />
                ) : (
                  visibles.map((registro, orden) => (
                    <tr key={registro.id} className="fila" style={{ '--orden': orden }}>
                      {columnas.map((columna) => (
                        <td key={columna.titulo} className={columna.clase}>
                          {columna.celda(registro)}
                        </td>
                      ))}
                      <td className="acciones">
                        <span className="acciones-fila">
                          <button
                            type="button"
                            className="boton boton-icono"
                            title="Editar"
                            aria-label="Editar"
                            onClick={() => setEnFormulario(registro)}
                          >
                            <Pencil aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="boton boton-icono peligro"
                            title="Eliminar"
                            aria-label="Eliminar"
                            onClick={() => setPorEliminar(registro)}
                          >
                            <Trash2 aria-hidden="true" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          !error && (
            <div className="vacio">
              {registros.length === 0 ? (
                <>
                  <strong>{textos.vacioTitulo}</strong>
                  {textos.vacioTexto}
                </>
              ) : (
                <>
                  <strong>Sin resultados</strong>
                  Ningún registro coincide con «{busqueda}».
                </>
              )}
            </div>
          )
        )}
      </section>

      {enFormulario && (
        <Formulario
          api={api}
          textos={textos}
          campos={campos}
          registro={enFormulario}
          alCerrar={() => setEnFormulario(null)}
          alGuardar={async (mensaje) => {
            setEnFormulario(null)
            avisar('exito', mensaje)
            await cargar()
          }}
        />
      )}

      {porEliminar && (
        <Confirmacion
          titulo={textos.eliminar}
          mensaje={textos.confirmar(porEliminar)}
          accion="Eliminar"
          alConfirmar={eliminar}
          alCerrar={() => setPorEliminar(null)}
        />
      )}
    </>
  )
}

function Formulario({ api, textos, campos, registro, alCerrar, alGuardar }) {
  const esNuevo = registro.id === undefined

  const [valores, setValores] = useState(() => {
    const iniciales = {}
    for (const campo of campos) {
      iniciales[campo.nombre] = registro[campo.nombre] ?? campo.inicial ?? ''
    }
    return iniciales
  })
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)

  function cambiar(nombre, valor) {
    setValores((actuales) => ({ ...actuales, [nombre]: valor }))
    setErrores((actuales) => ({ ...actuales, [nombre]: '' }))
  }

  async function guardar(evento) {
    evento.preventDefault()

    // Validación en el formulario antes de llamar a la API
    const encontrados = {}
    for (const campo of campos) {
      const mensaje = campo.validar?.(valores[campo.nombre])
      if (mensaje) encontrados[campo.nombre] = mensaje
    }
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return

    const datos = {}
    for (const campo of campos) {
      const valor = valores[campo.nombre]
      datos[campo.nombre] = campo.tipo === 'number' ? Number(valor) : valor
    }

    setEnviando(true)
    setErrorServidor('')
    try {
      if (esNuevo) {
        await api.crear(datos)
        await alGuardar(textos.creado)
      } else {
        await api.actualizar(registro.id, datos)
        await alGuardar(textos.actualizado)
      }
    } catch (e) {
      // La API rechazó la operación: se muestra su mensaje sin cerrar el formulario
      setErrorServidor(e.message)
      setEnviando(false)
    }
  }

  return (
    <Modal titulo={esNuevo ? textos.nuevo : textos.editar} alCerrar={alCerrar}>
      <form onSubmit={guardar} noValidate>
        <div className="modal-cuerpo formulario">
          {errorServidor && (
            <div className="alerta" role="alert">
              {errorServidor}
            </div>
          )}

          {campos.map((campo) => {
            const id = `campo-${campo.nombre}`

            if (campo.tipo === 'checkbox') {
              return (
                <div key={campo.nombre} className="campo completo">
                  <label className="casilla" htmlFor={id}>
                    <input
                      id={id}
                      type="checkbox"
                      checked={valores[campo.nombre]}
                      onChange={(evento) => cambiar(campo.nombre, evento.target.checked)}
                    />
                    {campo.etiqueta}
                  </label>
                  {campo.ayuda && <span className="campo-ayuda">{campo.ayuda}</span>}
                </div>
              )
            }

            const control = {
              id,
              value: valores[campo.nombre],
              placeholder: campo.ejemplo,
              'aria-invalid': Boolean(errores[campo.nombre]),
              onChange: (evento) => cambiar(campo.nombre, evento.target.value),
            }

            return (
              <Campo
                key={campo.nombre}
                id={id}
                etiqueta={campo.etiqueta}
                opcional={campo.opcional}
                ayuda={campo.ayuda}
                error={errores[campo.nombre]}
                completo={campo.completo}
              >
                {campo.tipo === 'textarea' ? (
                  <textarea {...control} />
                ) : (
                  <input {...control} type={campo.tipo} inputMode={campo.teclado} />
                )}
              </Campo>
            )
          })}
        </div>

        <div className="modal-pie">
          <button type="button" className="boton" onClick={alCerrar}>
            Cancelar
          </button>
          <button type="submit" className="boton boton-primario" disabled={enviando} aria-busy={enviando}>
            {esNuevo ? textos.guardarNuevo : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
