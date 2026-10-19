const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const fecha = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

const fechaLarga = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const hora = new Intl.DateTimeFormat('es-CO', {
  hour: 'numeric',
  minute: '2-digit',
})

const horaEnPunto = new Intl.DateTimeFormat('es-CO', { hour: 'numeric' })
const mes = new Intl.DateTimeFormat('es-CO', { month: 'long' })
const diaSemana = new Intl.DateTimeFormat('es-CO', { weekday: 'long' })

export const formatoPesos = (valor) => pesos.format(valor)
export const formatoFecha = (iso) => fecha.format(new Date(iso)).replace(',', '')
// Los espacios de una hora ("9:30 a. m.") se vuelven de no separación para que
// nunca se parta en dos renglones.
const sinCortes = (texto) => texto.replace(/\s/g, '\u00a0')

export const formatoHora = (iso) => sinCortes(hora.format(new Date(iso)))

// Fecha y hora locales en el formato que usa <input type="datetime-local">
export function paraCampoFecha(momento = new Date()) {
  const local = new Date(momento.getTime() - momento.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

// Un día se identifica por su clave "2026-10-12", la misma con la que empieza
// la fechaHora de cada cita.
export const claveDia = (momento = new Date()) => paraCampoFecha(momento).slice(0, 10)
const fechaDe = (clave) => new Date(`${clave}T12:00`)

export function moverDia(clave, dias) {
  const destino = fechaDe(clave)
  destino.setDate(destino.getDate() + dias)
  return claveDia(destino)
}

// "lunes 12 de octubre"
export const formatoDia = (clave) => fechaLarga.format(fechaDe(clave)).replace(',', '')
export const partesDia = (clave) => ({
  mes: mes.format(fechaDe(clave)),
  numero: Number(clave.slice(8)),
  semana: diaSemana.format(fechaDe(clave)),
})

// "Hoy", "Mañana", "Ayer" o null si el día no tiene nombre propio
export function nombreRelativo(clave, hoy = claveDia()) {
  if (clave === hoy) return 'Hoy'
  if (clave === moverDia(hoy, 1)) return 'Mañana'
  if (clave === moverDia(hoy, -1)) return 'Ayer'
  return null
}

// Minutos desde la medianoche: la medida con la que se dibuja la agenda
export const minutosDe = (iso) => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16))
export const minutosAhora = (momento = new Date()) => momento.getHours() * 60 + momento.getMinutes()
const momentoDe = (minutos) => new Date(2000, 0, 1, 0, minutos)

export const horaDeMinutos = (minutos) => sinCortes(hora.format(momentoDe(minutos)))
export const horaCorta = (minutos) => sinCortes(horaEnPunto.format(momentoDe(minutos)))
export const paraCampoHora = (minutos) =>
  `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`

// La hora partida en número y periodo: { reloj: "11:00", periodo: "a. m." }
export function partesHora(minutos) {
  const partes = hora.formatToParts(momentoDe(minutos))
  const periodo = partes.find((parte) => parte.type === 'dayPeriod')?.value ?? ''
  const reloj = partes
    .filter((parte) => parte.type === 'hour' || parte.type === 'minute')
    .map((parte) => parte.value)
    .join(':')
  return { reloj, periodo }
}

export const finDe = (cita) => minutosDe(cita.fechaHora) + cita.duracionMinutos

// Una cita que ya empezó: solo esas se pueden completar
export const yaEmpezo = (cita, momento = new Date()) => cita.fechaHora.slice(0, 16) <= paraCampoFecha(momento)

// El horario de atención de un día, en minutos: { apertura, cierre }.
// null si ese día no se atiende y undefined mientras no se conozca el horario.
// `horario` es la lista de GET /api/horario, con los días de 1 (lunes) a 7 (domingo).
const aMinutos = (hora) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5))
export function atencionDe(horario, clave) {
  if (!horario) return undefined
  const dia = fechaDe(clave).getDay() || 7
  const registro = horario.find((opcion) => opcion.diaSemana === dia)
  return registro?.abierto ? { apertura: aMinutos(registro.apertura), cierre: aMinutos(registro.cierre) } : null
}

// "Los sábados", "Los lunes"
export function losDias(clave) {
  const nombre = diaSemana.format(fechaDe(clave))
  return `Los ${nombre.endsWith('s') ? nombre : `${nombre}s`}`
}

// "a las 11:00 a. m.", "a la 1:30 p. m."
export function aLas(minutos) {
  const texto = horaDeMinutos(minutos)
  return `${texto.startsWith('1:') ? 'a la' : 'a las'}\u00a0${texto}`
}

// Una cita programada cuya hora de fin ya pasó: nadie la completó ni la canceló
export const sinCerrar = (cita, momento = new Date()) =>
  cita.estado === 'PROGRAMADA' &&
  (cita.fechaHora.slice(0, 10) < claveDia(momento) ||
    (cita.fechaHora.startsWith(claveDia(momento)) && finDe(cita) <= minutosAhora(momento)))

// Para buscar sin que importen las mayúsculas ni las tildes: "ramirez" encuentra "Ramírez"
export const paraBuscar = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

// "9:00 a. m. a 9:50 a. m."
export const tramo = (inicio, fin) => `${horaDeMinutos(inicio)} a ${horaDeMinutos(fin)}`

const NUMEROS = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce']

// "una cita", "cinco citas", "14 citas"
export function contarCitas(cantidad) {
  const numero = NUMEROS[cantidad] ?? String(cantidad)
  return `${numero} ${cantidad === 1 ? 'cita' : 'citas'}`
}
