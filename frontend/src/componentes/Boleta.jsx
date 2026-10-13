import { Check } from 'lucide-react'
import { finDe, formatoDia, formatoPesos, horaDeMinutos, minutosDe, partesHora, sinCerrar } from '../formato.js'
import Sello, { SelloEstado } from './Sello.jsx'

// Una cita como boleta: el talón con la hora y, al lado, quién, qué y con quién.
// Los botones van como contenido, por lo general <AccionesCita />.
export default function Boleta({ cita, children }) {
  const inicio = minutosDe(cita.fechaHora)
  const { reloj, periodo } = partesHora(inicio)

  return (
    <article className={`boleta ${cita.estado.toLowerCase()}`}>
      <div className="boleta-talon">
        <p className="boleta-hora">
          <b>{reloj}</b> {periodo}
        </p>
        <p className="boleta-dura">
          {cita.duracionMinutos} min, hasta {horaDeMinutos(finDe(cita))}
        </p>
      </div>

      <dl className="boleta-datos">
        <div>
          <dt>Cliente</dt>
          <dd className="boleta-cliente">{cita.clienteNombre}</dd>
          {cita.observaciones && <dd className="boleta-nota">{cita.observaciones}</dd>}
        </div>
        <div>
          <dt>Servicio</dt>
          <dd>
            {cita.servicioNombre} <span className="boleta-con">con {cita.barberoNombre}</span>
          </dd>
        </div>
        <div className="boleta-valor">
          <dt>Valor</dt>
          <dd className="numero">{formatoPesos(cita.precio)}</dd>
        </div>
      </dl>

      <div className="boleta-pie">
        <p className="boleta-estado">
          <span className="oculto">Estado: </span>
          <SelloEstado estado={cita.estado} />
          {/* Su hora ya pasó y nadie la completó ni la canceló */}
          {sinCerrar(cita) && <Sello tono="alerta">Sin cerrar</Sello>}
        </p>
        {children}
      </div>
    </article>
  )
}

// Lo que se puede hacer con una cita. Cada botón dice su acción con palabras;
// el nombre accesible añade de quién es la cita para distinguir una fila de otra.
export function AccionesCita({ cita, gestion }) {
  const cual = `cita de ${cita.clienteNombre}, ${horaDeMinutos(minutosDe(cita.fechaHora))}`

  return (
    <div className="boleta-acciones">
      {cita.estado === 'PROGRAMADA' && (
        <>
          <button
            type="button"
            className="boton boton-chico"
            aria-label={`Completar ${cual}`}
            onClick={() => gestion.completar(cita)}
          >
            <Check aria-hidden="true" />
            Completar
          </button>
          <button type="button" className="boton boton-chico" aria-label={`Editar ${cual}`} onClick={() => gestion.editar(cita)}>
            Editar
          </button>
          <button
            type="button"
            className="boton boton-chico"
            aria-label={`Cancelar ${cual}`}
            onClick={() => gestion.cancelar(cita)}
          >
            Cancelar cita
          </button>
        </>
      )}
      <button
        type="button"
        className="boton boton-chico boton-texto peligro"
        aria-label={`Eliminar ${cual}`}
        onClick={() => gestion.eliminar(cita)}
      >
        Eliminar
      </button>
    </div>
  )
}

// Los datos que identifican una cita, para no confirmar nada a ciegas
export function FichaCita({ cita }) {
  const inicio = minutosDe(cita.fechaHora)

  return (
    <dl className="ficha">
      <div>
        <dt>Cliente</dt>
        <dd>{cita.clienteNombre}</dd>
      </div>
      <div>
        <dt>Cuándo</dt>
        <dd>
          {formatoDia(cita.fechaHora.slice(0, 10))}, {horaDeMinutos(inicio)}
        </dd>
      </div>
      <div>
        <dt>Servicio</dt>
        <dd>
          {cita.servicioNombre}, {cita.duracionMinutos} min
        </dd>
      </div>
      <div>
        <dt>Barbero</dt>
        <dd>{cita.barberoNombre}</dd>
      </div>
    </dl>
  )
}
