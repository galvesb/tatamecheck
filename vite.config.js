import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy para a API do backend (porta 5000)
      '/api': 'http://localhost:5000'
    }
  }
})

