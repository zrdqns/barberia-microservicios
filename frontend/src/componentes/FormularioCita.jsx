import { UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { barberos, citas, clientes, horario, servicios } from '../api.js'
import { camposCliente } from '../camposCliente.js'
import { textoSonda, useConexion } from '../conexion.jsx'
import { REVISAR_CONEXION } from '../datos.js'
import {
  aLas,
  atencionDe,
  claveDia,
  finDe,
  formatoDia,
  formatoPesos,
  horaCorta,
  horaDeMinutos,
  losDias,
  minutosAhora,
  minutosDe,
  paraCampoHora,
  tramo,
} from '../formato.js'
import Alerta from './Alerta.jsx'
import Campo, { describe } from './Campo.jsx'
import VentanaFormulario from './VentanaFormulario.jsx'

// Un cliente se puede crear desde aquí con sus tres datos obligatorios
const CAMPOS_CLIENTE = camposCliente.filter((campo) => !campo.opcional)
const CLIENTE_VACIO = { nombre: '', documento: '', telefono: '' }

const CAMPO_DE = {
  clienteId: 'cita-cliente',
  servicioId: 'cita-servicio',
  barberoId: 'cita-barbero',
  fecha: 'cita-fecha',
  hora: 'cita-hora',
}

// Devuelve la lista, o null si su microservicio no respondió
async function listar(api) {
  try {
    return await api.listar()
  } catch {
    return null
  }
}

// `cita` sin id es una cita nueva; puede traer barberoId y fechaHora ya elegidos.
export default function FormularioCita({ cita, alCerrar, alGuardar }) {
  const esNueva = cita.id === undefined
  const { sonda } = useConexion()

  // Las opciones vienen de los dos microservicios: clientes y citas de api-citas,
  // servicios y barberos de api-catalogo. Cada lista se pide por separado para
  // que la caída de un microservicio no deje en blanco lo que sí respondió.
  const [opciones, setOpciones] = useState(null)
  const [cargando, setCargando] = useState(true)

  const [iniciales] = useState(() => ({
    clienteId: String(cita.clienteId ?? ''),
    servicioId: String(cita.servicioId ?? ''),
    barberoId: String(cita.barberoId ?? ''),
    fecha: cita.fechaHora?.slice(0, 10) || claveDia(),
    hora: cita.fechaHora?.slice(11, 16) ?? '',
    observaciones: cita.observaciones ?? '',
  }))
  const [valores, setValores] = useState(iniciales)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)

  // null: se elige un cliente existente · objeto: se está creando uno
  const [clienteNuevo, setClienteNuevo] = useState(null)
  const [erroresCliente, setErroresCliente] = useState({})
  const [errorCliente, setErrorCliente] = useState('')
  const [creando, setCreando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    const [listaClientes, listaServicios, listaBarberos, listaCitas, listaHorario] = await Promise.all([
      listar(clientes),
      listar(servicios),
      listar(barberos),
      listar(citas),
      listar(horario),
    ])
    setOpciones({
      clientes: listaClientes,
      servicios: listaServicios,
      barberos: listaBarberos,
      citas: listaCitas,
      horario: listaHorario,
    })
    setCargando(false)
    if (!listaClientes || !listaServicios || !listaBarberos) window.dispatchEvent(new Event(REVISAR_CONEXION))
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Mientras cargan las listas el selector de cliente está apagado y no puede
  // recibir el foco: se le da en cuanto llegan, que es por donde empieza el formulario.
  const hayOpciones = opciones !== null
  useEffect(() => {
    if (hayOpciones) document.getElementById('cita-cliente')?.focus()
  }, [hayOpciones])

  // Al abrir los campos del cliente nuevo, el foco pasa al primero
  const creandoCliente = clienteNuevo !== null
  useEffect(() => {
    if (creandoCliente) document.getElementById('nuevo-nombre')?.focus()
  }, [creandoCliente])

  const sinCitas = opciones !== null && opciones.clientes === null
  const sinCatalogo = opciones !== null && (opciones.servicios === null || opciones.barberos === null)

  // Al editar con un microservicio caído se conserva lo que la cita ya tenía
  const listaClientes = opciones?.clientes ?? (cita.clienteId ? [{ id: cita.clienteId, nombre: cita.clienteNombre }] : [])
  const listaServicios =
    opciones?.servicios ??
    (cita.servicioId
      ? [{ id: cita.servicioId, nombre: cita.servicioNombre, duracionMinutos: cita.duracionMinutos, precio: cita.precio, activo: true }]
      : [])
  const listaBarberos =
    opciones?.barberos ?? (cita.barberoId ? [{ id: cita.barberoId, nombre: cita.barberoNombre, activo: true }] : [])

  const servicioElegido = listaServicios.find((servicio) => String(servicio.id) === valores.servicioId)
  const barberoElegido = listaBarberos.find((barbero) => String(barbero.id) === valores.barberoId)

  // Citas que ya ocupan al barbero ese día. Solo las programadas bloquean el
  // horario: es la misma regla con la que api-citas acepta o rechaza la cita.
  const ocupadas = (opciones?.citas ?? [])
    .filter(
      (otra) =>
        otra.estado === 'PROGRAMADA' &&
        otra.id !== cita.id &&
        String(otra.barberoId) === valores.barberoId &&
        otra.fechaHora.startsWith(valores.fecha),
    )
    .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))

  const inicio = valores.hora ? minutosDe(`${valores.fecha}T${valores.hora}`) : null
  const horaPasada = inicio !== null && (valores.fecha < claveDia() || (valores.fecha === claveDia() && inicio < minutosAhora()))
  const fin = inicio !== null && servicioElegido ? inicio + servicioElegido.duracionMinutos : null
  const cruce = fin !== null ? ocupadas.find((otra) => inicio < finDe(otra) && minutosDe(otra.fechaHora) < fin) : undefined

  // El horario de atención de ese día: null si no se atiende, undefined si api-citas no lo entregó.
  // api-citas rechaza las citas que empiezan antes de abrir o terminan después de cerrar.
  const atencion = atencionDe(opciones?.horario, valores.fecha)
  const textoHorario = atencion ? `de ${horaDeMinutos(atencion.apertura)} a ${horaDeMinutos(atencion.cierre)}` : ''
  const ultimaHora = atencion ? atencion.cierre - (servicioElegido?.duracionMinutos ?? 0) : null
  const fueraDeHorario = Boolean(atencion) && inicio !== null && (inicio < atencion.apertura || inicio > ultimaHora)
  const ayudaHora = atencion
    ? `Se atiende ${textoHorario}.`
    : atencion === null && valores.fecha
      ? `${losDias(valores.fecha)} no se atiende.`
      : undefined

  const hayCambios = Object.keys(iniciales).some((nombre) => valores[nombre] !== iniciales[nombre]) || clienteNuevo !== null

  function cambiar(nombre, valor) {
    setValores((actuales) => ({ ...actuales, [nombre]: valor }))
    setErrores((actuales) => ({ ...actuales, [nombre]: '' }))
  }

  async function crearCliente() {
    const encontrados = {}
    for (const campo of CAMPOS_CLIENTE) {
      const mensaje = campo.validar(clienteNuevo[campo.nombre])
      if (mensaje) encontrados[campo.nombre] = mensaje
    }
    setErroresCliente(encontrados)
    const primero = Object.keys(encontrados)[0]
    if (primero) {
      document.getElementById(`nuevo-${primero}`)?.focus()
      return
    }

    setCreando(true)
    setErrorCliente('')
    try {
      const creado = await clientes.crear({ ...clienteNuevo, correo: '' })
      setOpciones((actuales) => ({ ...actuales, clientes: [...(actuales.clientes ?? []), creado] }))
      cambiar('clienteId', String(creado.id))
      setClienteNuevo(null)
    } catch (e) {
      setErrorCliente(e.message)
    }
    setCreando(false)
  }

  async function guardar(evento) {
    evento.preventDefault()
    if (enviando) return

    const hoy = claveDia()
    const encontrados = {}
    if (!valores.clienteId) {
      encontrados.clienteId = clienteNuevo ? 'Termine de crear el cliente o elija uno de la lista.' : 'Seleccione el cliente.'
    }
    if (!valores.servicioId) encontrados.servicioId = 'Seleccione el servicio.'
    if (!valores.barberoId) encontrados.barberoId = 'Seleccione el barbero.'
    if (!valores.fecha) encontrados.fecha = 'Indique la fecha.'
    else if (valores.fecha < hoy) encontrados.fecha = 'Esa fecha ya pasó.'
    else if (atencion === null) encontrados.fecha = `${losDias(valores.fecha)} la barbería no atiende.`
    if (!valores.hora) encontrados.hora = 'Indique la hora.'
    else if (valores.fecha === hoy && inicio < minutosAhora()) encontrados.hora = 'Esa hora ya pasó.'
    else if (fueraDeHorario) {
      encontrados.hora = servicioElegido
        ? `Se atiende ${textoHorario}: con ${servicioElegido.duracionMinutos} min, la última cita empieza ${aLas(ultimaHora)}.`
        : `Se atiende ${textoHorario}.`
    } else if (cruce) encontrados.hora = `Se cruza con la cita de ${cruce.clienteNombre}.`
    setErrores(encontrados)
    const primero = Object.keys(encontrados)[0]
    if (primero) {
      document.getElementById(CAMPO_DE[primero])?.focus()
      return
    }

    // Solo se envían los IDs: api-citas busca el servicio y el barbero en api-catalogo
    const datos = {
      clienteId: Number(valores.clienteId),
      servicioId: Number(valores.servicioId),
      barberoId: Number(valores.barberoId),
      fechaHora: `${valores.fecha}T${valores.hora}`,
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
      // La API rechazó la cita: su mensaje queda en el formulario y se vuelven a
      // pedir las listas, por si el motivo es que api-catalogo dejó de responder.
      setErrorServidor(e.message)
      setEnviando(false)
      cargar()
    }
  }

  const reintentar = (
    <button type="button" className="boton" disabled={cargando} aria-busy={cargando} onClick={cargar}>
      Reintentar
    </button>
  )
  const marcador = (texto) => (cargando ? 'Cargando…' : texto)

  return (
    <VentanaFormulario
      titulo={esNueva ? 'Agendar cita' : 'Editar cita'}
      textoGuardar={esNueva ? 'Agendar cita' : 'Guardar cambios'}
      enviando={enviando}
      bloqueado={cargando || sinCitas || (sinCatalogo && esNueva)}
      hayCambios={hayCambios}
      error={errorServidor}
      alEnviar={guardar}
      alCerrar={alCerrar}
    >
      {sinCitas && (
        <div className="completo">
          <Alerta titulo="api-citas no responde" acciones={reintentar}>
            Sin ese microservicio no se pueden consultar los clientes ni guardar la cita. Enciéndalo y reintente.
          </Alerta>
        </div>
      )}
      {sinCatalogo && !sinCitas && (
        <div className="completo">
          <Alerta titulo="api-catalogo no responde" acciones={reintentar}>
            Los servicios y los barberos vienen de ese microservicio, y api-citas lo consulta antes de guardar una cita.
            {esNueva
              ? ' Sin esas listas no se puede armar una cita nueva.'
              : ' Puede intentar guardar: api-citas contestará con su error y aparecerá aquí.'}
            {sonda && (
              <span className="respuesta-real">
                Ahora mismo api-citas responde: <code>{textoSonda(sonda)}</code>
              </span>
            )}
          </Alerta>
        </div>
      )}

      <Campo id="cita-cliente" etiqueta="Cliente" error={errores.clienteId} completo>
        <div className="campo-con-boton">
          <select
            id="cita-cliente"
            value={valores.clienteId}
            disabled={cargando || sinCitas || clienteNuevo !== null}
            aria-invalid={Boolean(errores.clienteId)}
            aria-describedby={describe('cita-cliente', errores.clienteId)}
            onChange={(evento) => cambiar('clienteId', evento.target.value)}
          >
            <option value="">{marcador(sinCitas ? 'No disponible' : 'Seleccione un cliente')}</option>
            {listaClientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
                {cliente.documento ? ` (${cliente.documento})` : ''}
              </option>
            ))}
          </select>
          {clienteNuevo === null && (
            <button
              type="button"
              className="boton"
              disabled={cargando || sinCitas}
              onClick={() => {
                setClienteNuevo(CLIENTE_VACIO)
                cambiar('clienteId', '')
              }}
            >
              <UserPlus aria-hidden="true" />
              Nuevo cliente
            </button>
          )}
        </div>
      </Campo>

      {clienteNuevo && (
        <fieldset className="subformulario completo">
          <legend>Nuevo cliente</legend>
          {errorCliente && (
            <div className="completo">
              <Alerta titulo="No se creó el cliente">{errorCliente}</Alerta>
            </div>
          )}
          {CAMPOS_CLIENTE.map((campo) => {
            const id = `nuevo-${campo.nombre}`
            return (
              <Campo key={campo.nombre} id={id} etiqueta={campo.etiqueta} error={erroresCliente[campo.nombre]} completo={campo.completo}>
                <input
                  id={id}
                  type={campo.tipo}
                  inputMode={campo.teclado}
                  value={clienteNuevo[campo.nombre]}
                  aria-invalid={Boolean(erroresCliente[campo.nombre])}
                  aria-describedby={describe(id, erroresCliente[campo.nombre])}
                  onChange={(evento) => {
                    const valor = campo.soloDigitos ? evento.target.value.replace(/\D/g, '') : evento.target.value
                    setClienteNuevo((actual) => ({ ...actual, [campo.nombre]: valor }))
                    setErroresCliente((actuales) => ({ ...actuales, [campo.nombre]: '' }))
                  }}
                  // Enter crea el cliente en lugar de enviar la cita a medio llenar
                  onKeyDown={(evento) => {
                    if (evento.key === 'Enter') {
                      evento.preventDefault()
                      crearCliente()
                    }
                  }}
                />
              </Campo>
            )
          })}
          <div className="subformulario-pie completo">
            <button
              type="button"
              className="boton"
              onClick={() => {
                setClienteNuevo(null)
                setErroresCliente({})
                setErrorCliente('')
              }}
            >
              Elegir uno de la lista
            </button>
            <button type="button" className="boton boton-fuerte" disabled={creando} aria-busy={creando} onClick={crearCliente}>
              Crear y elegir
            </button>
          </div>
        </fieldset>
      )}

      <Campo id="cita-servicio" etiqueta="Servicio" error={errores.servicioId}>
        <select
          id="cita-servicio"
          value={valores.servicioId}
          disabled={cargando || sinCatalogo}
          aria-invalid={Boolean(errores.servicioId)}
          aria-describedby={describe('cita-servicio', errores.servicioId)}
          onChange={(evento) => cambiar('servicioId', evento.target.value)}
        >
          <option value="">{marcador(sinCatalogo ? 'No disponible' : 'Seleccione un servicio')}</option>
          {listaServicios.map((servicio) => (
            <option key={servicio.id} value={servicio.id} disabled={!servicio.activo}>
              {servicio.nombre}
              {servicio.activo ? ` (${servicio.duracionMinutos} min, ${formatoPesos(servicio.precio)})` : ' (inactivo)'}
            </option>
          ))}
        </select>
      </Campo>

      <Campo id="cita-barbero" etiqueta="Barbero" error={errores.barberoId}>
        <select
          id="cita-barbero"
          value={valores.barberoId}
          disabled={cargando || sinCatalogo}
          aria-invalid={Boolean(errores.barberoId)}
          aria-describedby={describe('cita-barbero', errores.barberoId)}
          onChange={(evento) => cambiar('barberoId', evento.target.value)}
        >
          <option value="">{marcador(sinCatalogo ? 'No disponible' : 'Seleccione un barbero')}</option>
          {listaBarberos.map((barbero) => (
            <option key={barbero.id} value={barbero.id} disabled={!barbero.activo}>
              {barbero.nombre}
              {barbero.activo ? '' : ' (inactivo)'}
            </option>
          ))}
        </select>
      </Campo>

      <Campo id="cita-fecha" etiqueta="Fecha" error={errores.fecha}>
        <input
          id="cita-fecha"
          type="date"
          min={claveDia()}
          value={valores.fecha}
          aria-invalid={Boolean(errores.fecha)}
          aria-describedby={describe('cita-fecha', errores.fecha)}
          onChange={(evento) => cambiar('fecha', evento.target.value)}
        />
      </Campo>

      <Campo id="cita-hora" etiqueta="Hora" error={errores.hora} ayuda={ayudaHora}>
        <input
          id="cita-hora"
          type="time"
          step="300"
          min={atencion ? paraCampoHora(atencion.apertura) : undefined}
          max={atencion ? paraCampoHora(ultimaHora) : undefined}
          value={valores.hora}
          aria-invalid={Boolean(errores.hora)}
          aria-describedby={describe('cita-hora', errores.hora, ayudaHora)}
          onChange={(evento) => cambiar('hora', evento.target.value)}
        />
      </Campo>

      {barberoElegido && valores.fecha && opciones?.citas && (
        <Ocupacion
          barbero={barberoElegido}
          fecha={valores.fecha}
          ocupadas={ocupadas}
          inicio={inicio}
          fin={fin}
          cruce={cruce}
          horaPasada={horaPasada}
          atencion={atencion}
          fueraDeHorario={fueraDeHorario}
          textoHorario={textoHorario}
        />
      )}

      <Campo id="cita-observaciones" etiqueta="Observaciones" opcional completo>
        <textarea
          id="cita-observaciones"
          value={valores.observaciones}
          onChange={(evento) => cambiar('observaciones', evento.target.value)}
        />
      </Campo>
    </VentanaFormulario>
  )
}

// El día del barbero elegido: una franja con lo que ya tiene ocupado y dónde
// caería la cita nueva. Así el cruce se ve antes de guardar. La franja cubre el
// horario de atención de ese día y se alarga si algo queda por fuera.
function Ocupacion({ barbero, fecha, ocupadas, inicio, fin, cruce, horaPasada, atencion, fueraDeHorario, textoHorario }) {
  const marcas = [
    ...ocupadas.flatMap((otra) => [minutosDe(otra.fechaHora), finDe(otra)]),
    ...(atencion ? [atencion.apertura, atencion.cierre] : [480, 1200]),
    ...(fin !== null ? [inicio, fin] : []),
  ]
  const desde = Math.floor(Math.min(...marcas) / 60) * 60
  const hasta = Math.min(24, Math.ceil(Math.max(...marcas) / 60)) * 60
  const mal = cruce || horaPasada || fueraDeHorario
  const lugar = (desdeMinuto, hastaMinuto) => ({
    left: `${((desdeMinuto - desde) / (hasta - desde)) * 100}%`,
    width: `${((hastaMinuto - desdeMinuto) / (hasta - desde)) * 100}%`,
  })

  return (
    <div className="ocupacion completo">
      <p className="ocupacion-titulo">
        <strong>{barbero.nombre}</strong>, {formatoDia(fecha)}
      </p>

      <div className="franja" aria-hidden="true">
        {ocupadas.map((otra) => (
          <span key={otra.id} className="franja-ocupada" style={lugar(minutosDe(otra.fechaHora), finDe(otra))} />
        ))}
        {fin !== null && <span className={mal ? 'franja-nueva cruce' : 'franja-nueva'} style={lugar(inicio, fin)} />}
      </div>
      <div className="franja-escala" aria-hidden="true">
        <span>{horaCorta(desde)}</span>
        <span>{horaCorta((desde + hasta) / 2)}</span>
        <span>{horaCorta(hasta % 1440)}</span>
      </div>

      {ocupadas.length === 0 ? (
        <p>No tiene citas ese día.</p>
      ) : (
        <ul className="ocupacion-lista">
          {ocupadas.map((otra) => (
            <li key={otra.id}>
              <span className="numero">{tramo(minutosDe(otra.fechaHora), finDe(otra))}</span>
              <span>
                {otra.clienteNombre}, {otra.servicioNombre}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className={mal ? 'ocupacion-cruce' : 'ocupacion-libre'} role="status">
        {fin === null
          ? ''
          : horaPasada
            ? `La cita iría de ${tramo(inicio, fin)}, pero esa hora ya pasó. Elija una hora posterior.`
            : fueraDeHorario
              ? `La cita iría de ${tramo(inicio, fin)}, fuera del horario de atención (${textoHorario}).`
              : cruce
              ? `La cita iría de ${tramo(inicio, fin)} y se cruza con la de ${cruce.clienteNombre}. Elija otra hora u otro barbero.`
              : `La cita va de ${tramo(inicio, fin)} y ese horario está libre.`}
      </p>
    </div>
  )
}
