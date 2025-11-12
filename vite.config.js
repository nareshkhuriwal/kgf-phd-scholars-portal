import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',                  // keep for prod
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      // proxy static files served by Laravel (e.g., /storage/…)
      '/storage': {
        target: 'https://phdapi.khuriwalgroup.com',
        changeOrigin: true,
      },
      '/uploads': { target: 'https://phdapi.khuriwalgroup.com', changeOrigin: true }, // <— add this

      // proxy your API too (optional but recommended)
      '/api': {
        target: 'https://phdapi.khuriwalgroup.com',
        changeOrigin: true,
        // if you use Laravel Sanctum/session cookies during dev:
        // configure cookie domain in Laravel accordingly
      },
    },
  },
})
