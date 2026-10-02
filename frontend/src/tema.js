import { useState } from 'react'

// El tema inicial lo fija un script en index.html antes de pintar la página,
// para que no se vea un destello del tema contrario al cargar.
export function useTema() {
  const [tema, setTema] = useState(() => document.documentElement.dataset.tema ?? 'claro')

  function alternar() {
    const siguiente = tema === 'oscuro' ? 'claro' : 'oscuro'
    const raiz = document.documentElement

    // Durante un instante los colores se funden en lugar de saltar.
    // La clase se quita enseguida para no afectar el resto de transiciones.
    raiz.classList.add('cambiando-tema')
    raiz.dataset.tema = siguiente
    setTema(siguiente)
    setTimeout(() => raiz.classList.remove('cambiando-tema'), 260)

    try {
      localStorage.setItem('tema', siguiente)
    } catch {
      // Sin almacenamiento disponible el tema dura lo que dure la pestaña
    }
  }

  return [tema, alternar]
}
