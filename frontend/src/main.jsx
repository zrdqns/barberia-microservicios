import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource-variable/besley/wght.css'
import '@fontsource-variable/besley/wght-italic.css'
import '@fontsource-variable/hanken-grotesk/wght.css'
import './estilos/base.css'
import './estilos/estructura.css'
import './estilos/componentes.css'
import './estilos/citas.css'

import App from './App.jsx'
import { ProveedorAvisos } from './componentes/Avisos.jsx'
import { ProveedorConexion } from './conexion.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProveedorConexion>
      <ProveedorAvisos>
        <App />
      </ProveedorAvisos>
    </ProveedorConexion>
  </StrictMode>,
)
