import { CalendarDays, House, Moon, Scissors, Sun, UserRound, Users } from 'lucide-react'
import { useState } from 'react'
import Barberos from './paginas/Barberos.jsx'
import Citas from './paginas/Citas.jsx'
import Clientes from './paginas/Clientes.jsx'
import Inicio from './paginas/Inicio.jsx'
import Servicios from './paginas/Servicios.jsx'
import { useTema } from './tema.js'

const SECCIONES = [
  { clave: 'inicio', texto: 'Inicio', Icono: House },
  { clave: 'citas', texto: 'Citas', Icono: CalendarDays },
  { clave: 'clientes', texto: 'Clientes', Icono: Users },
  { clave: 'servicios', texto: 'Servicios', Icono: Scissors },
  { clave: 'barberos', texto: 'Barberos', Icono: UserRound },
]

export default function App() {
  const [seccion, setSeccion] = useState('inicio')
  const [tema, alternarTema] = useTema()

  const activo = SECCIONES.findIndex((opcion) => opcion.clave === seccion)

  return (
    <div className="app">
      <aside className="lateral">
        <div className="marca">
          <span className="poste" aria-hidden="true" />
          <div>
            <div className="marca-nombre">Barbería</div>
            <div className="marca-detalle">Gestión de citas</div>
          </div>
        </div>

        <nav className="menu" aria-label="Secciones" style={{ '--activo': activo }}>
          <span className="menu-pildora" aria-hidden="true" />
          {SECCIONES.map(({ clave, texto, Icono }) => (
            <button
              key={clave}
              type="button"
              aria-current={seccion === clave ? 'page' : undefined}
              onClick={() => setSeccion(clave)}
            >
              <Icono aria-hidden="true" />
              {texto}
            </button>
          ))}
        </nav>

        <div className="lateral-pie">
          <button type="button" className="boton-tema" onClick={alternarTema}>
            {tema === 'oscuro' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            {tema === 'oscuro' ? 'Tema claro' : 'Tema oscuro'}
          </button>
          <p className="lateral-nota">Diseño de Soluciones · Prototipo 2</p>
        </div>
      </aside>

      {/* La clave hace que cada sección se monte de nuevo y entre con su fundido */}
      <main className="contenido">
        <div className="pagina" key={seccion}>
          {seccion === 'inicio' && <Inicio irA={setSeccion} />}
          {seccion === 'citas' && <Citas />}
          {seccion === 'clientes' && <Clientes />}
          {seccion === 'servicios' && <Servicios />}
          {seccion === 'barberos' && <Barberos />}
        </div>
      </main>
    </div>
  )
}
