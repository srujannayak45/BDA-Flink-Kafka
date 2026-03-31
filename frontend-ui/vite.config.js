import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/ws': {
        target: 'ws://backend-api:3001',
        ws: true
      },
      '/api': {
        target: 'http://backend-api:3001'
      }
    }
  }
})
