import { useEffect, useState } from 'react'

// Dice si la pantalla cumple una consulta de CSS, por ejemplo '(max-width: 900px)'.
export function useMedia(consulta) {
  const [coincide, setCoincide] = useState(() => window.matchMedia(consulta).matches)

  useEffect(() => {
    const medio = window.matchMedia(consulta)
    const alCambiar = () => setCoincide(medio.matches)
    medio.addEventListener('change', alCambiar)
    return () => medio.removeEventListener('change', alCambiar)
  }, [consulta])

  return coincide
}
