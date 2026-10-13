import { useState } from 'react'

// El tema inicial lo fija un script en index.html antes de pintar la página,
// para que no se vea un destello del tema contrario al cargar.
export function useTema() {
  const [tema, setTema] = useState(() => document.documentElement.dataset.tema ?? 'claro')

  function alternar() {
    const siguiente = tema === 'oscuro' ? 'claro' : 'oscuro'
    const raiz = document.documentElement

    // Las transiciones se apagan durante el cambio: si no, cada color se
    // funde a su ritmo y la pantalla se ve manchada por un instante.
    raiz.classList.add('cambiando-tema')
    raiz.dataset.tema = siguiente
    setTema(siguiente)
    void raiz.offsetHeight
    requestAnimationFrame(() => raiz.classList.remove('cambiando-tema'))

    try {
      localStorage.setItem('tema', siguiente)
    } catch {
      // Sin almacenamiento disponible el tema dura lo que dure la pestaña
    }
  }

  return [tema, alternar]
}
