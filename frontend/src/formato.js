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

const hora = new Intl.DateTimeFormat('es-CO', {
  hour: 'numeric',
  minute: '2-digit',
})

export const formatoPesos = (valor) => pesos.format(valor)
export const formatoFecha = (iso) => fecha.format(new Date(iso))
export const formatoHora = (iso) => hora.format(new Date(iso))

// Fecha y hora locales en el formato que usa <input type="datetime-local">
export function paraCampoFecha(momento = new Date()) {
  const local = new Date(momento.getTime() - momento.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}
