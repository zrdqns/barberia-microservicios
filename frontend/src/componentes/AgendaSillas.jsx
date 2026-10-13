import { Check } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { contarCitas, finDe, horaCorta, horaDeMinutos, minutosDe, partesHora } from '../formato.js'
import { Esqueleto } from './Esqueleto.jsx'

const ALTO_HORA = 72 // píxeles que ocupa una hora
const PASO = 30 // minutos de cada espacio libre
const alto = (minutos) => (minutos * ALTO_HORA) / 60

// El libro de citas de un día: una columna por silla y las horas hacia abajo.
// Cada cita ocupa el alto de su duración; tocar un espacio libre agenda ahí.
//
// sillas: [{ id, nombre, recibe, nota }]   recibe: si se le puede agendar
// ahora:  minutos del día si se está viendo hoy; null en otro día
// limite: minuto antes del cual ya no se puede agendar
export default function AgendaSillas({ sillas, citas, ahora, limite, seleccion, alElegir, alAgendar }) {
  const vista = useRef(null)

  const marcas = citas.flatMap((cita) => [minutosDe(cita.fechaHora), finDe(cita)])
  const desde = Math.min(8, Math.floor(Math.min(480, ...marcas) / 60))
  const hasta = Math.min(24, Math.max(20, Math.ceil(Math.max(1200, ...marcas) / 60)))
  const arriba = (minutos) => alto(minutos - desde * 60)

  const horas = Array.from({ length: hasta - desde }, (_, orden) => desde + orden)
  const huecos = Array.from({ length: ((hasta - desde) * 60) / PASO }, (_, orden) => desde * 60 + orden * PASO)
  const ahoraVisible = ahora !== null && ahora >= desde * 60 && ahora <= hasta * 60

  // La agenda se desplaza por dentro. Al abrir un día arranca una hora antes de
  // lo que importa: la hora actual si es hoy, o la primera cita si es otro día.
  const arranque = ahoraVisible ? ahora : marcas.length ? Math.min(...marcas) : desde * 60
  const desplazamiento = Math.max(0, alto(arranque - 60 - desde * 60))
  // Corre una vez por día (quien usa el componente le pone key con el día):
  // el reloj no debe mover la vista mientras alguien la está usando.
  useEffect(() => {
    vista.current.scrollTop = desplazamiento
  }, [])

  return (
    <div className="agenda" ref={vista} style={{ '--sillas': sillas.length }} tabIndex={0} role="group" aria-label="Agenda por sillas">
      <div className="agenda-cabecera">
        <span className="agenda-esquina">Hora</span>
        {sillas.map((silla) => {
          const cantidad = citas.filter((cita) => cita.barberoId === silla.id).length
          return (
            <div key={silla.id} className={silla.recibe ? 'agenda-silla' : 'agenda-silla sin-turnos'}>
              <strong>{silla.nombre}</strong>
              <span>{silla.nota ?? (cantidad === 0 ? 'Libre todo el día' : contarCitas(cantidad))}</span>
            </div>
          )
        })}
      </div>

      <div className="agenda-cuerpo" style={{ height: alto((hasta - desde) * 60) }}>
        <div className="agenda-horas" aria-hidden="true">
          {horas.map((hora) => (
            <span key={hora} style={{ top: arriba(hora * 60) }}>
              {horaCorta(hora * 60)}
            </span>
          ))}
        </div>

        {sillas.map((silla) => (
          <div key={silla.id} className="agenda-columna" role="group" aria-label={`Silla de ${silla.nombre}`}>
            {/* Atajo para el ratón: quien usa teclado o lector agenda con el botón «Agendar cita» */}
            {silla.recibe &&
              huecos.map((minuto) => (
                <button
                  key={minuto}
                  type="button"
                  className="hueco"
                  tabIndex={-1}
                  aria-hidden="true"
                  disabled={minuto < limite}
                  style={{ top: arriba(minuto), height: alto(PASO) }}
                  onClick={() => alAgendar(silla, minuto)}
                >
                  Agendar a las {horaDeMinutos(minuto)}
                </button>
              ))}

            {citas
              .filter((cita) => cita.barberoId === silla.id)
              .map((cita) => {
                const inicio = minutosDe(cita.fechaHora)
                const estado = cita.estado.toLowerCase()
                const atrasada = cita.estado === 'PROGRAMADA' && finDe(cita) <= limite
                const clases = ['turno', estado]
                // Una cita corta solo tiene alto para un renglón
                if (cita.duracionMinutos < 40) clases.push('corto')
                if (atrasada) clases.push('sin-cerrar')
                return (
                  <button
                    key={cita.id}
                    type="button"
                    className={clases.join(' ')}
                    aria-pressed={seleccion === cita.id}
                    aria-label={`${horaDeMinutos(inicio)}, ${cita.clienteNombre}, ${cita.servicioNombre}, ${atrasada ? 'sin cerrar' : estado}`}
                    style={{ top: arriba(inicio), height: Math.max(alto(cita.duracionMinutos), 26) }}
                    onClick={() => alElegir(cita)}
                  >
                    <span className="turno-cabeza">
                      <span className="turno-hora">
                        {cita.estado === 'COMPLETADA' && <Check aria-hidden="true" />}
                        {partesHora(inicio).reloj}
                        {/* En una silla angosta se omite: la escala de la izquierda ya lo dice */}
                        <span className="turno-periodo"> {partesHora(inicio).periodo}</span>
                      </span>
                      <strong>{cita.clienteNombre}</strong>
                    </span>
                    <span className="turno-servicio">
                      {atrasada ? 'Sin cerrar. ' : ''}
                      {cita.servicioNombre}
                    </span>
                  </button>
                )
              })}
          </div>
        ))}

        {limite > desde * 60 && (
          <div className="agenda-pasado" style={{ height: arriba(Math.min(limite, hasta * 60)) }} aria-hidden="true" />
        )}
        {ahoraVisible && (
          <div className="agenda-ahora" style={{ top: arriba(ahora) }}>
            <span>
              <span className="oculto">Ahora: </span>
              {horaDeMinutos(ahora)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// La misma rejilla mientras llegan los datos
export function AgendaEsqueleto() {
  return (
    <div className="agenda" style={{ '--sillas': 2 }} aria-hidden="true">
      <div className="agenda-cabecera">
        <span className="agenda-esquina">Hora</span>
        {[0, 1].map((silla) => (
          <div key={silla} className="agenda-silla">
            <Esqueleto ancho="62%" clase="alto" />
            <Esqueleto ancho="40%" />
          </div>
        ))}
      </div>
      <div className="agenda-cuerpo en-carga" style={{ height: alto(5 * 60) }}>
        <div className="agenda-horas" />
        {[40, 150].map((arriba, silla) => (
          <div key={silla} className="agenda-columna">
            <span className="esqueleto turno-falso" style={{ top: arriba, height: 48 + silla * 14 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
