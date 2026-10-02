import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow-condensed/600.css'
import './estilos.css'

import App from './App.jsx'
import { ProveedorAvisos } from './componentes/Avisos.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProveedorAvisos>
      <App />
    </ProveedorAvisos>
  </StrictMode>,
)
