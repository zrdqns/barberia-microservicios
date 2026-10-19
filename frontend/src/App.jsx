import { Armchair, CalendarDays, Moon, RefreshCw, Scissors, Sun, Ticket, Users } from 'lucide-react'
import { useEffect } from 'react'
import { EN_LOCAL } from './api.js'
import Alerta from './componentes/Alerta.jsx'
import { textoSonda, useConexion } from './conexion.jsx'
import { rutaDe, useSeccion } from './navegacion.js'
import Barberos from './paginas/Barberos.jsx'
import Citas from './paginas/Citas.jsx'
import Clientes from './paginas/Clientes.jsx'
import Inicio from './paginas/Inicio.jsx'
import Servicios from './paginas/Servicios.jsx'
import { useTema } from './tema.js'

const SECCIONES = [
  { clave: 'hoy', texto: 'Hoy', Icono: CalendarDays, Pagina: Inicio },
  { clave: 'citas', texto: 'Citas', Icono: Ticket, Pagina: Citas },
  { clave: 'clientes', texto: 'Clientes', Icono: Users, Pagina: Clientes },
  { clave: 'servicios', texto: 'Servicios', Icono: Scissors, Pagina: Servicios },
  { clave: 'barberos', texto: 'Barberos', Icono: Armchair, Pagina: Barberos },
]
const CLAVES = SECCIONES.map((seccion) => seccion.clave)

export default function App() {
  const seccion = useSeccion(CLAVES)
  const [tema, alternarTema] = useTema()
  const { texto, Pagina } = SECCIONES.find((opcion) => opcion.clave === seccion)

  // La pestaña del navegador dice en qué sección se está
  useEffect(() => {
    document.title = `${texto} | Barbería El Remolino`
  }, [texto])

  return (
    <div className="app">
      <button type="button" className="saltar" onClick={() => document.getElementById('contenido').focus()}>
        Saltar al contenido
      </button>

      <aside className="lateral">
        <div className="lateral-fijo">
          <a className="letrero" href={rutaDe('hoy')} aria-label="Barbería El Remolino, ir a Hoy">
            <small>Barbería</small>
            <b>El Remolino</b>
          </a>

          <nav className="menu" aria-label="Secciones">
            {SECCIONES.map(({ clave, texto: nombre, Icono }) => (
              <a key={clave} href={rutaDe(clave)} aria-current={seccion === clave ? 'page' : undefined}>
                <Icono aria-hidden="true" />
                {nombre}
              </a>
            ))}
          </nav>

          <div className="lateral-pie">
            <LucesConexion />
            <button type="button" className="boton-lateral" onClick={alternarTema}>
              {tema === 'oscuro' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
              <span>{tema === 'oscuro' ? 'Tema claro' : 'Tema oscuro'}</span>
            </button>
            <p className="lateral-nota">Diseño de Soluciones, prototipo 2</p>
          </div>
        </div>
      </aside>

      <main id="contenido" className="contenido" tabIndex={-1}>
        <AvisoConexion />
        {/* La clave monta cada sección de nuevo: ninguna hereda el estado de otra */}
        <div className="pagina" key={seccion}>
          <Pagina />
        </div>
      </main>
    </div>
  )
}

const estadoDe = (valor) => (valor === undefined ? 'espera' : valor ? 'bien' : 'caido')

// Siempre a la vista, en todas las secciones: los dos microservicios y la llamada
// que api-citas le hace a api-catalogo. Al pulsarlo se comprueban de nuevo.
function LucesConexion() {
  const { apiCitas, apiCatalogo, entreApis, sonda, comprobando, comprobar } = useConexion()

  const filas = [
    { nombre: 'api-citas', valor: apiCitas, bien: 'en línea', mal: 'caído' },
    { nombre: 'api-catalogo', valor: apiCatalogo, bien: 'en línea', mal: 'caído' },
    {
      // La llamada de api-citas a api-catalogo, con el código que contestó
      nombre: 'RestClient',
      valor: entreApis,
      bien: 'HTTP 200',
      mal: sonda?.codigo ? `HTTP ${sonda.codigo}` : 'sin respuesta',
    },
  ]
  const caidas = filas.filter((fila) => fila.valor === false)
  const resumen =
    apiCitas === undefined
      ? 'Comprobando microservicios'
      : caidas.length === 0
        ? 'Los dos microservicios en línea'
        : `${caidas[0].nombre} ${caidas[0].mal}`

  return (
    <button
      type="button"
      className="boton-lateral luces"
      title="Comprobar ahora"
      aria-busy={comprobando}
      onClick={comprobar}
    >
      {/* En el teléfono solo cabe una luz con el resumen */}
      <span className="luces-resumen" data-estado={apiCitas === undefined ? 'espera' : caidas.length ? 'caido' : 'bien'}>
        <span className="luz" aria-hidden="true" />
        <span>{resumen}</span>
      </span>
      <span className="luces-lista">
        {/* Los signos ocultos separan las frases para quien usa lector de pantalla */}
        <span className="luces-titulo">
          Microservicios<span className="oculto">: </span>
        </span>
        {filas.map((fila) => (
          <span key={fila.nombre} className="luces-fila" data-estado={estadoDe(fila.valor)}>
            <span className="luz" aria-hidden="true" />
            <code>{fila.nombre}</code>
            <span>
              <span className="oculto"> </span>
              {fila.valor === undefined ? 'comprobando' : fila.valor ? fila.bien : fila.mal}
              <span className="oculto">. </span>
            </span>
          </span>
        ))}
      </span>
    </button>
  )
}

// Cuando algo no responde, cada sección lo dice arriba: qué pasa, qué se puede
// hacer y qué no, y lo que api-citas contestó de verdad en la última comprobación.
function AvisoConexion() {
  const { apiCitas, apiCatalogo, entreApis, sonda, comprobando, comprobar } = useConexion()
  if (apiCitas === undefined || (apiCitas && apiCatalogo && entreApis)) return null

  let titulo
  let texto
  if (!apiCitas && !apiCatalogo) {
    titulo = 'Ningún microservicio responde'
    texto = EN_LOCAL
      ? 'Encienda api-catalogo (puerto 8081) y api-citas (puerto 8080). Mientras tanto no hay datos que mostrar.'
      : 'Los microservicios están en Vercel y se apagan tras unos minutos sin uso; al volver tardan unos segundos. Si siguen sin responder, revise su despliegue.'
  } else if (!apiCitas) {
    titulo = 'api-citas no responde'
    texto =
      'No se pueden consultar ni guardar clientes ni citas. Servicios y barberos se pueden consultar y editar, pero no eliminar: antes de eliminar, api-catalogo le pregunta a api-citas si tienen citas programadas.'
  } else if (!apiCatalogo) {
    titulo = 'api-catalogo no responde'
    texto =
      'Los clientes y las citas ya agendadas se pueden consultar. Agendar o editar una cita no: api-citas necesita consultar el catálogo.'
  } else {
    titulo = 'api-citas no alcanza a api-catalogo'
    texto = 'Los dos están encendidos, pero la llamada entre ellos falla. No se pueden agendar ni editar citas.'
  }

  return (
    <Alerta
      titulo={titulo}
      acciones={
        <button type="button" className="boton" disabled={comprobando} aria-busy={comprobando} onClick={comprobar}>
          <RefreshCw aria-hidden="true" />
          Comprobar de nuevo
        </button>
      }
    >
      {texto}
      {apiCitas && sonda && (
        <span className="respuesta-real">
          Respuesta de api-citas al consultarlo: <code>{textoSonda(sonda)}</code>
        </span>
      )}
    </Alerta>
  )
}
