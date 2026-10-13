import { useEffect, useState } from 'react'

// La sección abierta vive en la dirección (#/citas, #/clientes...).
// Así F5 y los botones atrás y adelante del navegador conservan el lugar.
function leer(validas) {
  const clave = location.hash.replace(/^#\/?/, '')
  return validas.includes(clave) ? clave : validas[0]
}

export function useSeccion(validas) {
  const [seccion, setSeccion] = useState(() => leer(validas))

  useEffect(() => {
    const alCambiar = () => {
      setSeccion(leer(validas))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [validas])

  return seccion
}

export const rutaDe = (clave) => `#/${clave}`
