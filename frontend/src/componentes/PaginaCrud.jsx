import { Pencil, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useLista } from '../datos.js'
import { paraBuscar } from '../formato.js'
import Alerta from './Alerta.jsx'
import { useAvisos } from './Avisos.jsx'
import Campo, { describe } from './Campo.jsx'
import Confirmacion from './Confirmacion.jsx'
import Encabezado, { Vacio } from './Encabezado.jsx'
import { FilasEsqueleto } from './Esqueleto.jsx'
import VentanaFormulario from './VentanaFormulario.jsx'

// Pantalla de gestión de un recurso: lista, búsqueda, crear, editar y eliminar.
// Clientes, servicios y barberos la reutilizan cambiando solo la configuración.
export default function PaginaCrud({ api, textos, columnas, campos, textoBusqueda }) {
  const avisar = useAvisos()
  const { lista, cargando, recargando, error, cargar } = useLista(api)
  const [busqueda, setBusqueda] = useState('')

  // null: formulario cerrado · {}: registro nuevo · {id, ...}: registro en edición
  const [enFormulario, setEnFormulario] = useState(null)
  const [porEliminar, setPorEliminar] = useState(null)

  // Si la API rechaza la eliminación, el error sale de aquí y la confirmación lo muestra
  async function eliminar() {
    await api.eliminar(porEliminar.id)
    avisar('exito', textos.eliminado)
    await cargar()
    setPorEliminar(null)
  }

  const registros = lista ?? []
  const termino = paraBuscar(busqueda)
  const visibles = registros.filter((registro) => paraBuscar(textoBusqueda(registro)).includes(termino))

  return (
    <>
      <Encabezado titulo={textos.titulo} descripcion={textos.descripcion}>
        <button type="button" className="boton boton-primario" onClick={() => setEnFormulario({})}>
          <Plus aria-hidden="true" />
          {textos.nuevo}
        </button>
      </Encabezado>

      {error && (
        <Alerta
          titulo={lista ? 'La lista puede estar desactualizada' : 'No se pudo cargar la lista'}
          acciones={
            <button type="button" className="boton" disabled={recargando} aria-busy={recargando} onClick={cargar}>
              Reintentar
            </button>
          }
        >
          {error}
        </Alerta>
      )}

      {(cargando || lista) && (
        <section className="bloque" aria-busy={cargando || recargando} aria-label={textos.titulo}>
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
            <span className="conteo">{cargando ? 'Cargando…' : `${visibles.length} de ${registros.length}`}</span>
          </div>

          {cargando || visibles.length > 0 ? (
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    {columnas.map((columna) => (
                      <th key={columna.titulo} scope="col" className={columna.clase}>
                        {columna.titulo}
                      </th>
                    ))}
                    <th scope="col" className="acciones">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <FilasEsqueleto columnas={columnas.length} />
                  ) : (
                    visibles.map((registro) => (
                      <tr key={registro.id}>
                        {columnas.map((columna) => (
                          <td key={columna.titulo} className={columna.clase} data-titulo={columna.titulo}>
                            {columna.celda(registro)}
                          </td>
                        ))}
                        <td className="acciones">
                          <span className="acciones-fila">
                            <button
                              type="button"
                              className="boton boton-chico"
                              aria-label={`Editar: ${registro.nombre}`}
                              onClick={() => setEnFormulario(registro)}
                            >
                              <Pencil aria-hidden="true" />
                              Editar
                            </button>
                            <button
                              type="button"
                              className="boton boton-chico boton-texto peligro"
                              aria-label={`Eliminar: ${registro.nombre}`}
                              onClick={() => setPorEliminar(registro)}
                            >
                              Eliminar
                            </button>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : registros.length === 0 ? (
            <Vacio titulo={textos.vacioTitulo}>
              <p>{textos.vacioTexto}</p>
              <button type="button" className="boton boton-primario" onClick={() => setEnFormulario({})}>
                <Plus aria-hidden="true" />
                {textos.nuevo}
              </button>
            </Vacio>
          ) : (
            <Vacio titulo="Sin resultados">
              <p>
                {textos.ninguno} coincide con «{busqueda}».
              </p>
              <div className="vacio-acciones">
                <button type="button" className="boton" onClick={() => setBusqueda('')}>
                  Limpiar la búsqueda
                </button>
                <button type="button" className="boton" onClick={() => setEnFormulario({})}>
                  <Plus aria-hidden="true" />
                  {textos.nuevo}
                </button>
              </div>
            </Vacio>
          )}
        </section>
      )}

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
        <Confirmacion titulo={textos.eliminar} accion="Eliminar" alConfirmar={eliminar} alCerrar={() => setPorEliminar(null)}>
          <p>{textos.confirmar(porEliminar)}</p>
        </Confirmacion>
      )}
    </>
  )
}

function Formulario({ api, textos, campos, registro, alCerrar, alGuardar }) {
  const esNuevo = registro.id === undefined

  const [iniciales] = useState(() => {
    const valores = {}
    for (const campo of campos) {
      valores[campo.nombre] = registro[campo.nombre] ?? campo.inicial ?? ''
    }
    return valores
  })
  const [valores, setValores] = useState(iniciales)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)

  const hayCambios = campos.some((campo) => valores[campo.nombre] !== iniciales[campo.nombre])

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
    const primero = Object.keys(encontrados)[0]
    if (primero) {
      document.getElementById(`campo-${primero}`)?.focus()
      return
    }

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
    <VentanaFormulario
      titulo={esNuevo ? textos.nuevo : textos.editar}
      textoGuardar={esNuevo ? textos.guardarNuevo : 'Guardar cambios'}
      enviando={enviando}
      hayCambios={hayCambios}
      error={errorServidor}
      alEnviar={guardar}
      alCerrar={alCerrar}
    >
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
                  aria-describedby={describe(id, '', campo.ayuda)}
                  onChange={(evento) => cambiar(campo.nombre, evento.target.checked)}
                />
                {campo.etiqueta}
              </label>
              {campo.ayuda && (
                <span id={`${id}-ayuda`} className="campo-ayuda">
                  {campo.ayuda}
                </span>
              )}
            </div>
          )
        }

        const control = {
          id,
          value: valores[campo.nombre],
          placeholder: campo.ejemplo,
          'aria-invalid': Boolean(errores[campo.nombre]),
          'aria-describedby': describe(id, errores[campo.nombre], campo.ayuda),
          // En documento y teléfono solo quedan los números: "300 123 4567" pasa a "3001234567"
          onChange: (evento) =>
            cambiar(campo.nombre, campo.soloDigitos ? evento.target.value.replace(/\D/g, '') : evento.target.value),
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
    </VentanaFormulario>
  )
}
