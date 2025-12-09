import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true,
    open: true,
    // PROXY: IMPORTANTE para desarrollo local
    proxy: {
      '/api': {
        target: 'https://trabajotracker-backend.vercel.app',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})