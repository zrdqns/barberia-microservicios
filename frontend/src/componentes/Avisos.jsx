import { CircleAlert, CircleCheck } from 'lucide-react'
import { createContext, useCallback, useContext, useState } from 'react'

const ContextoAvisos = createContext(() => {})

const DURACION = 4500
const SALIDA = 180

// Mensajes breves que confirman una acción o informan un error.
export function ProveedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([])

  const avisar = useCallback((tipo, texto) => {
    const id = crypto.randomUUID()
    setAvisos((actuales) => [...actuales, { id, tipo, texto, saliendo: false }])

    // Primero se marca para que salga con su transición y luego se quita
    setTimeout(() => {
      setAvisos((actuales) => actuales.map((aviso) => (aviso.id === id ? { ...aviso, saliendo: true } : aviso)))
    }, DURACION - SALIDA)
    setTimeout(() => {
      setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== id))
    }, DURACION)
  }, [])

  return (
    <ContextoAvisos.Provider value={avisar}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((aviso) => (
          <div key={aviso.id} className={`aviso ${aviso.tipo} ${aviso.saliendo ? 'saliendo' : ''}`}>
            {aviso.tipo === 'error' ? <CircleAlert aria-hidden="true" /> : <CircleCheck aria-hidden="true" />}
            {aviso.texto}
          </div>
        ))}
      </div>
    </ContextoAvisos.Provider>
  )
}

// Uso: const avisar = useAvisos();  avisar('exito', 'Cliente creado')
export const useAvisos = () => useContext(ContextoAvisos)
