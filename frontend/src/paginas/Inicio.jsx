import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { barberos, citas } from '../api.js'
import AgendaSillas, { AgendaEsqueleto } from '../componentes/AgendaSillas.jsx'
import Alerta from '../componentes/Alerta.jsx'
import Boleta, { AccionesCita } from '../componentes/Boleta.jsx'
import { Vacio } from '../componentes/Encabezado.jsx'
import { BoletasEsqueleto, Esqueleto } from '../componentes/Esqueleto.jsx'
import { useGestionCitas } from '../componentes/GestionCitas.jsx'
import Sello from '../componentes/Sello.jsx'
import { textoSonda, useConexion } from '../conexion.jsx'
import { useLista } from '../datos.js'
import {
  aLas,
  claveDia,
  contarCitas,
  finDe,
  formatoFecha,
  formatoHora,
  formatoPesos,
  minutosAhora,
  minutosDe,
  moverDia,
  nombreRelativo,
  paraCampoHora,
  partesDia,
} from '../formato.js'
import { rutaDe } from '../navegacion.js'
import { useMedia } from '../pantalla.js'

const sumar = (lista) => lista.reduce((total, cita) => total + cita.precio, 0)

export default function Inicio() {
  const agenda = useLista(citas)
  const equipo = useLista(barberos)
  const gestion = useGestionCitas(agenda.cargar)
  // En pantallas angostas las columnas por silla no caben: el día se lee como lista
  const angosta = useMedia('(max-width: 900px)')

  // El reloj avanza solo para mover la línea de «ahora»
  const [momento, setMomento] = useState(() => new Date())
  useEffect(() => {
    const reloj = setInterval(() => setMomento(new Date()), 30000)
    return () => clearInterval(reloj)
  }, [])

  const hoy = claveDia(momento)
  const ahora = minutosAhora(momento)
  const [dia, setDia] = useState(hoy)
  const [elegida, setElegida] = useState(null)
  // Hacia dónde se pasó la hoja del calendario; sin valor mientras no se haya pasado ninguna
  const [sentido, setSentido] = useState(undefined)

  function verDia(clave, cita = null) {
    setSentido(clave < dia ? 'atras' : 'adelante')
    setDia(clave)
    setElegida(cita)
  }

  const todas = agenda.lista ?? []
  const delDia = todas
    .filter((cita) => cita.fechaHora.startsWith(dia))
    .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
  const enAgenda = delDia.filter((cita) => cita.estado !== 'CANCELADA')
  const pendientes = delDia.filter((cita) => cita.estado === 'PROGRAMADA')
  const completadas = delDia.filter((cita) => cita.estado === 'COMPLETADA')
  const canceladas = delDia.length - enAgenda.length

  // Hoy, lo que sigue es la primera cita programada que aún no termina. Las que
  // ya pasaron sin que nadie las completara ni cancelara quedan «sin cerrar».
  const vencidas = dia < hoy ? pendientes : dia === hoy ? pendientes.filter((cita) => finDe(cita) <= ahora) : []
  const siguiente = pendientes.find((cita) => !vencidas.includes(cita))
  // La boleta del costado muestra la cita que se tocó; si no, la que sigue o la primera sin cerrar
  const enBoleta = enAgenda.find((cita) => cita.id === elegida) ?? siguiente ?? vencidas[0]

  const despues = todas
    .filter((cita) => cita.estado === 'PROGRAMADA' && cita.fechaHora.slice(0, 10) > dia)
    .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
    .slice(0, 4)

  // Una silla por barbero activo. Si una cita del día es de un barbero que ya
  // no está activo, o el catálogo no responde, su silla sale igual, sin espacios libres.
  const sillas = (equipo.lista ?? []).filter((barbero) => barbero.activo).map((barbero) => ({ ...barbero, recibe: true }))
  for (const cita of enAgenda) {
    if (!sillas.some((silla) => silla.id === cita.barberoId)) {
      sillas.push({
        id: cita.barberoId,
        nombre: cita.barberoNombre,
        recibe: false,
        nota: equipo.lista ? 'Inactivo' : 'Sin datos del catálogo',
      })
    }
  }
  // Siempre en el mismo orden, responda o no el catálogo
  sillas.sort((a, b) => a.id - b.id)
  const sinSilla = (equipo.lista ?? []).filter((barbero) => !barbero.activo && !sillas.some((silla) => silla.id === barbero.id))

  const partes = partesDia(dia)
  const sujeto = nombreRelativo(dia, hoy) ?? `El ${partes.semana} ${partes.numero}`
  const verbo = dia < hoy ? 'hubo' : 'hay'

  let resumen
  if (dia < hoy) {
    resumen = `Completadas: ${completadas.length}. Canceladas: ${canceladas}. Sin cerrar: ${vencidas.length}.`
  } else if (siguiente) {
    resumen = (
      <>
        {dia === hoy ? 'Sigue' : 'La primera es'} <b>{siguiente.clienteNombre}</b>{' '}
        <b>{aLas(minutosDe(siguiente.fechaHora))}</b> con {siguiente.barberoNombre}.
        {pendientes.length - vencidas.length > 1 && ` Quedan ${contarCitas(pendientes.length - vencidas.length)} por atender.`}
        {vencidas.length > 0 && ` Hay ${contarCitas(vencidas.length)} sin cerrar de más temprano.`}
      </>
    )
  } else if (vencidas.length > 0) {
    resumen = `No queda nadie por atender, pero hay ${contarCitas(vencidas.length)} sin cerrar: complétela o cancélela.`
  } else if (enAgenda.length > 0) {
    resumen = 'No queda nadie por atender.'
  } else {
    resumen = dia === hoy ? 'Agende la primera cita del día.' : 'Ese día está libre.'
  }

  const agendar = (previo) => gestion.agendar({ fechaHora: dia < hoy ? hoy : dia, ...previo })
  // null pinta un esqueleto; si api-citas no respondió no hay cifra que dar
  const cifra = (valor) => (agenda.cargando ? null : agenda.lista ? valor : 'Sin dato')

  let tituloBoleta = 'Sigue'
  if (enBoleta && enBoleta.id === elegida && enBoleta.id !== siguiente?.id) tituloBoleta = 'Cita elegida'
  else if (!siguiente && vencidas.length > 0) tituloBoleta = 'Sin cerrar'

  return (
    <>
      <header className="hoy-cabecera">
        <div className="hoja" aria-hidden="true">
          <span className="hoja-mes">{partes.mes}</span>
          <b key={dia} className="hoja-numero" data-sentido={sentido}>
            {partes.numero}
          </b>
          <span className="hoja-semana">{partes.semana}</span>
        </div>

        <div className="hoy-titular" aria-busy={agenda.cargando}>
          {agenda.cargando ? (
            <>
              <h1 className="oculto">Cargando la agenda</h1>
              <Esqueleto ancho="min(420px, 80%)" clase="titular" />
              <Esqueleto ancho="min(520px, 95%)" />
            </>
          ) : agenda.lista ? (
            <>
              <h1>
                {enAgenda.length === 0 ? (
                  `${sujeto} no ${verbo} citas.`
                ) : (
                  <>
                    {sujeto} {verbo} <em>{contarCitas(enAgenda.length)}</em>.
                  </>
                )}
              </h1>
              <p>{resumen}</p>
            </>
          ) : (
            <>
              <h1>No se pudo consultar la agenda.</h1>
              <p>Las citas viven en api-citas, que no respondió.</p>
            </>
          )}
        </div>

        <div className="hoy-acciones">
          <button type="button" className="boton boton-primario" onClick={() => agendar()}>
            <Plus aria-hidden="true" />
            Agendar cita
          </button>
          <a className="boton" href={rutaDe('citas')}>
            Ver todas las citas
          </a>
        </div>
      </header>

      {agenda.error && (
        <Alerta
          titulo={agenda.lista ? 'La agenda puede estar desactualizada' : 'No se pudo cargar la agenda'}
          acciones={
            <button type="button" className="boton" disabled={agenda.recargando} aria-busy={agenda.recargando} onClick={agenda.cargar}>
              Reintentar
            </button>
          }
        >
          {agenda.error}
        </Alerta>
      )}

      <div className="hoy-rejilla">
        <section className="bloque hoy-dia" aria-busy={agenda.cargando || agenda.recargando} aria-labelledby="titulo-dia">
          {agenda.recargando && <div className="barra-carga" />}

          <div className="bloque-titulo">
            <h2 id="titulo-dia">El día</h2>
            <div className="paso-dias">
              <button type="button" className="boton-icono" aria-label="Día anterior" onClick={() => verDia(moverDia(dia, -1))}>
                <ChevronLeft aria-hidden="true" />
              </button>
              <input
                type="date"
                className="fecha-salto"
                aria-label="Ir a una fecha"
                value={dia}
                onChange={(evento) => evento.target.value && verDia(evento.target.value)}
              />
              <button type="button" className="boton-icono" aria-label="Día siguiente" onClick={() => verDia(moverDia(dia, 1))}>
                <ChevronRight aria-hidden="true" />
              </button>
              <button type="button" className="boton boton-chico" disabled={dia === hoy} onClick={() => verDia(hoy)}>
                Hoy
              </button>
            </div>
          </div>

          {agenda.cargando || equipo.cargando ? (
            angosta ? (
              <ul className="boletas en-bloque">
                <BoletasEsqueleto cantidad={3} />
              </ul>
            ) : (
              <AgendaEsqueleto />
            )
          ) : !agenda.lista ? (
            <Vacio titulo="Sin agenda">
              <p>Cuando api-citas responda, las citas del día aparecerán aquí.</p>
            </Vacio>
          ) : angosta ? (
            delDia.length > 0 ? (
              <ul className="boletas en-bloque">
                {delDia.map((cita) => (
                  <li key={cita.id}>
                    <Boleta cita={cita}>
                      <AccionesCita cita={cita} gestion={gestion} />
                    </Boleta>
                  </li>
                ))}
              </ul>
            ) : (
              <Vacio titulo="Día sin citas">
                <p>{dia < hoy ? 'No se agendó nada ese día.' : 'Todavía no hay nada agendado para este día.'}</p>
              </Vacio>
            )
          ) : sillas.length > 0 ? (
            <>
              {/* La clave abre cada día en su hora de arranque */}
              <AgendaSillas
                key={dia}
                sillas={sillas}
                citas={enAgenda}
                ahora={dia === hoy ? ahora : null}
                limite={dia < hoy ? Infinity : dia === hoy ? ahora : 0}
                seleccion={enBoleta?.id}
                alElegir={(cita) => setElegida(cita.id)}
                alAgendar={(silla, minuto) => agendar({ barberoId: silla.id, fechaHora: `${dia}T${paraCampoHora(minuto)}` })}
              />
              <p className="agenda-pie">
                {dia < hoy
                  ? 'Día pasado: ya no se puede agendar en él. Pulse una cita para verla en la boleta.'
                  : 'Pulse un espacio libre para agendar a esa hora con ese barbero, o una cita para verla en la boleta.'}
                {sinSilla.length > 0 && ` Sin silla por estar inactivo: ${sinSilla.map((barbero) => barbero.nombre).join(', ')}.`}
              </p>
            </>
          ) : equipo.lista ? (
            <Vacio titulo="No hay barberos activos">
              <p>La agenda abre una silla por cada barbero activo.</p>
              <a className="boton" href={rutaDe('barberos')}>
                Ir a Barberos
              </a>
            </Vacio>
          ) : (
            <Vacio titulo="No se pueden mostrar las sillas">
              <p>Los barberos vienen de api-catalogo, que no respondió, y este día no tiene citas.</p>
            </Vacio>
          )}
        </section>

        <div className="hoy-lado">
          {!angosta && (
            <section className="bloque hoy-boleta" aria-labelledby="titulo-boleta" aria-busy={agenda.cargando}>
              <div className="bloque-titulo">
                <h2 id="titulo-boleta">{tituloBoleta}</h2>
              </div>
              {agenda.cargando ? (
                <ul className="boletas en-bloque">
                  <BoletasEsqueleto cantidad={1} />
                </ul>
              ) : enBoleta ? (
                <div className="boletas en-bloque">
                  <Boleta cita={enBoleta}>
                    <AccionesCita cita={enBoleta} gestion={gestion} />
                  </Boleta>
                </div>
              ) : (
                <p className="bloque-nota">
                  {enAgenda.length > 0 ? 'Todas las citas del día están cerradas.' : 'Nada pendiente en este día.'}
                </p>
              )}
            </section>
          )}

          <section className="bloque" aria-labelledby="titulo-cuenta" aria-busy={agenda.cargando}>
            <div className="bloque-titulo">
              <h2 id="titulo-cuenta">La cuenta del día</h2>
            </div>
            <dl className="cuenta">
              <Renglon nombre="Por atender" valor={cifra(pendientes.length - vencidas.length)} />
              {vencidas.length > 0 && <Renglon nombre="Sin cerrar" valor={cifra(vencidas.length)} />}
              <Renglon nombre="Completadas" valor={cifra(completadas.length)} />
              <Renglon nombre="Canceladas" valor={cifra(canceladas)} />
            </dl>
            <dl className="cuenta cuenta-dinero">
              <Renglon nombre="Recaudado" valor={cifra(formatoPesos(sumar(completadas)))} />
              <Renglon nombre="Por recaudar" valor={cifra(formatoPesos(sumar(pendientes)))} />
            </dl>
          </section>

          {despues.length > 0 && (
            <section className="bloque" aria-labelledby="titulo-despues">
              <div className="bloque-titulo">
                <h2 id="titulo-despues">Después</h2>
              </div>
              <ul className="despues">
                {despues.map((cita) => (
                  <li key={cita.id}>
                    <button type="button" onClick={() => verDia(cita.fechaHora.slice(0, 10), cita.id)}>
                      <span className="despues-cuando">
                        <b>{formatoHora(cita.fechaHora)}</b>
                        {formatoFecha(cita.fechaHora)}
                      </span>
                      <span className="despues-quien">
                        <b>{cita.clienteNombre}</b>
                        {cita.servicioNombre} con {cita.barberoNombre}
                      </span>
                      <ChevronRight aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Microservicios />
        </div>
      </div>

      {gestion.ventanas}
    </>
  )
}

function Renglon({ nombre, valor }) {
  return (
    <div>
      <dt>{nombre}</dt>
      <dd>{valor === null ? <Esqueleto ancho="40px" /> : valor}</dd>
    </div>
  )
}

// El estado de los dos microservicios y de la llamada que api-citas le hace a
// api-catalogo, con lo que api-citas contestó la última vez que se le preguntó.
function Microservicios() {
  const { apiCitas, apiCatalogo, entreApis, sonda, comprobando, comprobar } = useConexion()

  return (
    <section className="bloque" aria-labelledby="titulo-micro" aria-busy={comprobando}>
      <div className="bloque-titulo">
        <h2 id="titulo-micro">Microservicios</h2>
        <button type="button" className="boton boton-chico" disabled={comprobando} aria-busy={comprobando} onClick={comprobar}>
          <RefreshCw aria-hidden="true" />
          Comprobar
        </button>
      </div>
      <ul className="micro">
        <li>
          <div>
            <code>api-citas</code>
            <span>Puerto 8080, clientes y citas</span>
          </div>
          <Conexion activa={apiCitas} si="En línea" no="Sin respuesta" />
        </li>
        <li>
          <div>
            <code>api-catalogo</code>
            <span>Puerto 8081, servicios y barberos</span>
          </div>
          <Conexion activa={apiCatalogo} si="En línea" no="Sin respuesta" />
        </li>
        <li>
          <div>
            <strong>Llamada con RestClient</strong>
            <span>api-citas consulta a api-catalogo</span>
          </div>
          <Conexion activa={entreApis} si="Conectadas" no="Sin conexión" />
        </li>
      </ul>
      {sonda && (
        <p className="micro-respuesta">
          api-citas respondió a las {formatoHora(sonda.hora)}: <code>{textoSonda(sonda)}</code>
        </p>
      )}
    </section>
  )
}

function Conexion({ activa, si, no }) {
  if (activa === undefined) return <Esqueleto ancho="92px" clase="sello-falso" />
  return activa ? <Sello tono="ok">{si}</Sello> : <Sello tono="alerta">{no}</Sello>
}
