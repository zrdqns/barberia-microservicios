import { ArrowRight, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { barberos, citas, clientes, estado, servicios } from '../api.js'
import { Esqueleto } from '../componentes/Esqueleto.jsx'
import { formatoFecha, formatoHora } from '../formato.js'
import { conMinimo } from '../tiempo.js'

// Consulta una lista sin interrumpir las demás si su microservicio está apagado
async function listarSeguro(api) {
  try {
    return await api.listar()
  } catch {
    return null
  }
}

async function responde(consulta) {
  try {
    await consulta()
    return true
  } catch {
    return false
  }
}

export default function Inicio({ irA }) {
  const [datos, setDatos] = useState(null)
  const [conexiones, setConexiones] = useState(null)

  const cargar = useCallback(async () => {
    setConexiones(null)

    // Las siete consultas salen a la vez: la pantalla tarda lo que tarde la más lenta
    const [listaCitas, listaClientes, listaServicios, listaBarberos, apiCitas, apiCatalogo, entreApis] =
      await conMinimo(
        Promise.all([
          listarSeguro(citas),
          listarSeguro(clientes),
          listarSeguro(servicios),
          listarSeguro(barberos),
          responde(estado.citas),
          responde(estado.catalogo),
          responde(estado.conexion),
        ]),
      )

    setDatos({ citas: listaCitas, clientes: listaClientes, servicios: listaServicios, barberos: listaBarberos })
    setConexiones({ apiCitas, apiCatalogo, entreApis })
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const programadas = (datos?.citas ?? [])
    .filter((cita) => cita.estado === 'PROGRAMADA')
    .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))

  // Si la lista es null su microservicio no respondió: se muestra una raya
  const contar = (lista, filtro = () => true) => (lista ? lista.filter(filtro).length : '—')

  return (
    <>
      <header className="encabezado">
        <div>
          <h1>Inicio</h1>
          <p>Lo que viene en la agenda y el estado de los microservicios.</p>
        </div>
        <button type="button" className="boton boton-primario" onClick={() => irA('citas')}>
          Ir a la agenda
          <ArrowRight aria-hidden="true" />
        </button>
      </header>

      <dl className="tarjeta resumen" aria-busy={!datos}>
        <Cifra titulo="Citas programadas" valor={datos && contar(datos.citas, (cita) => cita.estado === 'PROGRAMADA')} />
        <Cifra titulo="Clientes" valor={datos && contar(datos.clientes)} />
        <Cifra titulo="Servicios activos" valor={datos && contar(datos.servicios, (servicio) => servicio.activo)} />
        <Cifra titulo="Barberos activos" valor={datos && contar(datos.barberos, (barbero) => barbero.activo)} />
      </dl>

      <div className="rejilla-inicio">
        <section className="tarjeta" aria-busy={!datos}>
          <div className="tarjeta-titulo">
            <h2>Próximas citas</h2>
          </div>

          {!datos && (
            <ul className="agenda" aria-hidden="true">
              {[0, 1, 2].map((fila) => (
                <li key={fila}>
                  <Esqueleto ancho="64px" clase="alto" />
                  <div>
                    <Esqueleto ancho="55%" />
                  </div>
                  <Esqueleto ancho="90px" />
                </li>
              ))}
            </ul>
          )}

          {datos && programadas.length > 0 && (
            <ul className="agenda">
              {programadas.slice(0, 6).map((cita) => (
                <li key={cita.id}>
                  <div>
                    <div className="agenda-hora">{formatoHora(cita.fechaHora)}</div>
                    <span className="dato-menor">{formatoFecha(cita.fechaHora)}</span>
                  </div>
                  <div>
                    <span className="dato-principal">{cita.clienteNombre}</span>
                    <span className="dato-menor">
                      {cita.servicioNombre} · {cita.duracionMinutos} min
                    </span>
                  </div>
                  <span className="dato-menor">con {cita.barberoNombre}</span>
                </li>
              ))}
            </ul>
          )}

          {datos && programadas.length === 0 && (
            <div className="vacio">
              {datos.citas ? (
                <>
                  <strong>No hay citas programadas</strong>
                  Las citas que se agenden aparecerán aquí en orden de fecha.
                </>
              ) : (
                <>
                  <strong>No se pudo consultar la agenda</strong>
                  api-citas no responde. Verifique que esté encendida.
                </>
              )}
            </div>
          )}
        </section>

        <section className="tarjeta" aria-busy={!conexiones}>
          <div className="tarjeta-titulo">
            <h2>Microservicios</h2>
            <button type="button" className="boton boton-fila" disabled={!conexiones} onClick={cargar}>
              <RefreshCw aria-hidden="true" />
              Comprobar
            </button>
          </div>

          <ul className="servicios-estado">
            <li>
              <div>
                <code>api-citas</code>
                <span className="dato-menor">Puerto 8080 · clientes y citas</span>
              </div>
              <Conexion activa={conexiones?.apiCitas} si="En línea" no="Sin respuesta" />
            </li>
            <li>
              <div>
                <code>api-catalogo</code>
                <span className="dato-menor">Puerto 8081 · servicios y barberos</span>
              </div>
              <Conexion activa={conexiones?.apiCatalogo} si="En línea" no="Sin respuesta" />
            </li>
            <li>
              <div>
                <code>api-citas → api-catalogo</code>
                <span className="dato-menor">Comunicación entre backends con RestClient</span>
              </div>
              <Conexion activa={conexiones?.entreApis} si="Conectadas" no="Sin conexión" />
            </li>
          </ul>
        </section>
      </div>
    </>
  )
}

function Cifra({ titulo, valor }) {
  return (
    <div>
      <dt>{titulo}</dt>
      <dd>{valor === null ? <Esqueleto ancho="44px" clase="alto" /> : valor}</dd>
    </div>
  )
}

function Conexion({ activa, si, no }) {
  if (activa === undefined) return <Esqueleto ancho="92px" clase="pastilla" />
  return activa ? <span className="etiqueta verde">{si}</span> : <span className="etiqueta rojo">{no}</span>
}
