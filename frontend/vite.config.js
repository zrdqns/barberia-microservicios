import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Los dos microservicios solo aceptan peticiones desde este origen (CORS)
    port: 5173,
    strictPort: true,
  },
})
