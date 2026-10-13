import { createContext, use, useCallback, useEffect, useRef, useState } from 'react'
import { API_CITAS, estado } from './api.js'
import { CONEXION_RECUPERADA, REVISAR_CONEXION } from './datos.js'
import { conMinimo } from './tiempo.js'

const ContextoConexion = createContext(null)

const CADA = 15000

async function responde(consulta) {
  try {
    await consulta()
    return true
  } catch {
    return false
  }
}

// La llamada entre backends se pide aparte para conservar lo que api-citas
// contesta de verdad: el código HTTP y su mensaje (200 si alcanzó a
// api-catalogo, 503 si no). Eso es lo que se muestra en pantalla.
async function sondear() {
  try {
    const respuesta = await fetch(`${API_CITAS}/api/conexion/catalogo`)
    const texto = await respuesta.text()
    let mensaje = texto
    try {
      mensaje = JSON.parse(texto).mensaje ?? texto
    } catch {
      // La respuesta no era JSON: se deja el texto tal cual
    }
    return { codigo: respuesta.status, mensaje }
  } catch {
    return { codigo: null, mensaje: 'api-citas no contestó.' }
  }
}

// Vigila los dos microservicios y la llamada entre ellos.
// apiCitas, apiCatalogo y entreApis son undefined mientras no se han comprobado.
// sonda: { codigo, mensaje, hora } de la última llamada entre backends.
export function ProveedorConexion({ children }) {
  const [conexion, setConexion] = useState({})
  const [comprobando, setComprobando] = useState(false)
  const anterior = useRef({})

  const consultar = useCallback(async () => {
    const [apiCitas, apiCatalogo, sonda] = await Promise.all([
      responde(estado.citas),
      responde(estado.catalogo),
      sondear(),
    ])

    const volvio =
      (anterior.current.apiCitas === false && apiCitas) || (anterior.current.apiCatalogo === false && apiCatalogo)
    anterior.current = { apiCitas, apiCatalogo }
    setConexion({ apiCitas, apiCatalogo, entreApis: sonda.codigo === 200, sonda: { ...sonda, hora: new Date() } })
    if (volvio) window.dispatchEvent(new Event(CONEXION_RECUPERADA))
  }, [])

  // La comprobación que pide una persona dura lo suficiente para que se note
  const comprobar = useCallback(async () => {
    setComprobando(true)
    await conMinimo(consultar())
    setComprobando(false)
  }, [consultar])

  useEffect(() => {
    consultar()
    const reloj = setInterval(consultar, CADA)
    const alVolver = () => document.visibilityState === 'visible' && consultar()
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener(REVISAR_CONEXION, consultar)
    return () => {
      clearInterval(reloj)
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener(REVISAR_CONEXION, consultar)
    }
  }, [consultar])

  return <ContextoConexion value={{ ...conexion, comprobando, comprobar }}>{children}</ContextoConexion>
}

export const useConexion = () => use(ContextoConexion)

// "HTTP 503: El catálogo no está disponible." o, si api-citas ni contestó, solo el mensaje
export const textoSonda = (sonda) => (sonda.codigo ? `HTTP ${sonda.codigo}: ${sonda.mensaje}` : sonda.mensaje)
