import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 8080,
    host: '0.0.0.0',
    allowedHosts: ['mindful-optimism-production.up.railway.app', '.railway.app']
  }
})
