import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',                 // IMPORTANT for production
  build: {
    outDir: 'dist',          // default; shown for clarity
    assetsDir: 'assets',
    sourcemap: false,
  },
  server: { port: 5173 }
})
