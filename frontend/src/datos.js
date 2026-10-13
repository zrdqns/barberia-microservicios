import { useCallback, useEffect, useState } from 'react'
import { conMinimo } from './tiempo.js'

// Última lista recibida de cada recurso. Al volver a una sección se muestra de
// inmediato y se actualiza por detrás: el esqueleto solo sale la primera vez.
const memoria = new Map()

export const CONEXION_RECUPERADA = 'conexion-recuperada'
export const REVISAR_CONEXION = 'revisar-conexion'

export function useLista(api) {
  const [lista, setLista] = useState(() => memoria.get(api) ?? null)
  const [recargando, setRecargando] = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    const primera = !memoria.has(api)
    setRecargando(true)
    try {
      const datos = await (primera ? conMinimo(api.listar()) : api.listar())
      memoria.set(api, datos)
      setLista(datos)
      setError('')
    } catch (e) {
      setError(e.message)
      // Quien vigila los microservicios vuelve a comprobarlos enseguida
      window.dispatchEvent(new Event(REVISAR_CONEXION))
    }
    setRecargando(false)
  }, [api])

  useEffect(() => {
    cargar()
    // Cuando un microservicio caído vuelve, la lista se pide de nuevo sola
    window.addEventListener(CONEXION_RECUPERADA, cargar)
    return () => window.removeEventListener(CONEXION_RECUPERADA, cargar)
  }, [cargar])

  // cargando: aún no hay nada que mostrar (esqueleto).
  // recargando: ya hay una lista o un error en pantalla y se está pidiendo otra vez.
  const cargando = lista === null && !error
  return { lista, cargando, recargando: recargando && !cargando, error, cargar }
}
