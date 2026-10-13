import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { citas } from '../api.js'
import Alerta from '../componentes/Alerta.jsx'
import Boleta, { AccionesCita } from '../componentes/Boleta.jsx'
import Encabezado, { Vacio } from '../componentes/Encabezado.jsx'
import { BoletasEsqueleto } from '../componentes/Esqueleto.jsx'
import { useGestionCitas } from '../componentes/GestionCitas.jsx'
import { useLista } from '../datos.js'
import { claveDia, formatoDia, nombreRelativo, paraBuscar } from '../formato.js'

const FILTROS = [
  { valor: 'TODAS', texto: 'Todas' },
  { valor: 'PROGRAMADA', texto: 'Programadas' },
  { valor: 'COMPLETADA', texto: 'Completadas' },
  { valor: 'CANCELADA', texto: 'Canceladas' },
]

const mayuscula = (texto) => texto[0].toUpperCase() + texto.slice(1)

// Junta las citas por día. Primero hoy y lo que viene, del más cercano al más
// lejano; después los días que ya pasaron, del más reciente hacia atrás.
function agrupar(lista, hoy) {
  const dias = new Map()
  for (const cita of lista) {
    const clave = cita.fechaHora.slice(0, 10)
    if (!dias.has(clave)) dias.set(clave, [])
    dias.get(clave).push(cita)
  }
  const grupos = [...dias].map(([clave, delDia]) => ({ clave, citas: delDia }))
  return {
    proximos: grupos.filter((grupo) => grupo.clave >= hoy),
    anteriores: grupos.filter((grupo) => grupo.clave < hoy).reverse(),
  }
}

export default function Citas() {
  const { lista, cargando, recargando, error, cargar } = useLista(citas)
  const gestion = useGestionCitas(cargar)
  const [filtro, setFiltro] = useState('TODAS')
  const [busqueda, setBusqueda] = useState('')

  const todas = [...(lista ?? [])].sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
  const termino = paraBuscar(busqueda)
  const encontradas = todas.filter((cita) =>
    paraBuscar(`${cita.clienteNombre} ${cita.servicioNombre} ${cita.barberoNombre}`).includes(termino),
  )
  const visibles = filtro === 'TODAS' ? encontradas : encontradas.filter((cita) => cita.estado === filtro)
  const cuantas = (valor) => (valor === 'TODAS' ? encontradas : encontradas.filter((cita) => cita.estado === valor)).length

  const hoy = claveDia()
  const { proximos, anteriores } = agrupar(visibles, hoy)

  const grupo = ({ clave, citas: delDia }) => {
    const relativo = nombreRelativo(clave, hoy)
    return (
      <section key={clave} className="dia" aria-label={formatoDia(clave)}>
        <h2>
          {relativo ?? mayuscula(formatoDia(clave))} {relativo && <small>{formatoDia(clave)}</small>}
        </h2>
        <ul className="boletas">
          {delDia.map((cita) => (
            <li key={cita.id}>
              <Boleta cita={cita}>
                <AccionesCita cita={cita} gestion={gestion} />
              </Boleta>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <>
      <Encabezado titulo="Citas" descripcion="Cada boleta une un cliente, un servicio y un barbero.">
        <button type="button" className="boton boton-primario" onClick={() => gestion.agendar()}>
          <Plus aria-hidden="true" />
          Agendar cita
        </button>
      </Encabezado>

      {error && (
        <Alerta
          titulo={lista ? 'La lista puede estar desactualizada' : 'No se pudieron cargar las citas'}
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
        <div className="citas" aria-busy={cargando || recargando}>
          <div className="herramientas sueltas">
            <div className="buscador">
              <Search aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar cliente, servicio o barbero"
                aria-label="Buscar cliente, servicio o barbero"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
              />
            </div>
            <div className="filtros" role="group" aria-label="Filtrar por estado">
              {FILTROS.map((opcion) => (
                <button
                  key={opcion.valor}
                  type="button"
                  aria-pressed={filtro === opcion.valor}
                  onClick={() => setFiltro(opcion.valor)}
                >
                  {opcion.texto} {!cargando && <span className="filtro-cuenta">{cuantas(opcion.valor)}</span>}
                </button>
              ))}
            </div>
          </div>

          {recargando && <div className="barra-carga suelta" />}

          {cargando ? (
            <section className="dia">
              <h2 className="oculto">Cargando las citas</h2>
              <ul className="boletas">
                <BoletasEsqueleto />
              </ul>
            </section>
          ) : visibles.length > 0 ? (
            <>
              {proximos.map(grupo)}
              {anteriores.length > 0 && proximos.length > 0 && <p className="corte-dias">Días anteriores</p>}
              {anteriores.map(grupo)}
            </>
          ) : todas.length === 0 ? (
            <div className="bloque">
              <Vacio titulo="Aún no hay citas">
                <p>Una cita necesita un cliente, un servicio activo y un barbero activo.</p>
                <button type="button" className="boton boton-primario" onClick={() => gestion.agendar()}>
                  <Plus aria-hidden="true" />
                  Agendar cita
                </button>
              </Vacio>
            </div>
          ) : (
            <div className="bloque">
              <Vacio titulo="Ninguna cita coincide">
                <p>
                  {termino ? `No hay citas con «${busqueda}»` : 'No hay citas'}
                  {filtro === 'TODAS' ? '.' : ' en ese estado.'}
                </p>
                <button
                  type="button"
                  className="boton"
                  onClick={() => {
                    setBusqueda('')
                    setFiltro('TODAS')
                  }}
                >
                  Ver todas las citas
                </button>
              </Vacio>
            </div>
          )}
        </div>
      )}

      {gestion.ventanas}
    </>
  )
}
