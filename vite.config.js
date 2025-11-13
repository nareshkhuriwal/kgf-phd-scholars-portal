import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0'
}

export default defineConfig({
  plugins: [react()],
  base: '/',                  // keep for prod
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },

  // Disable cache for anything served by Vite dev server
  server: {
    port: 5173,
    headers: noCacheHeaders,
    proxy: {
      // proxy static files served by Laravel (e.g., /storage/…)
      '/storage': {
        // target: 'http://localhost:8000',
        target: 'https://phdapi.khuriwalgroup.com',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // force no-cache on proxied responses
            proxyRes.headers['cache-control'] = noCacheHeaders['Cache-Control']
            proxyRes.headers['pragma'] = noCacheHeaders['Pragma']
            proxyRes.headers['expires'] = noCacheHeaders['Expires']
          })
        }
      },

      '/uploads': {
        // target: 'http://localhost:8000',
        target: 'https://phdapi.khuriwalgroup.com',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['cache-control'] = noCacheHeaders['Cache-Control']
            proxyRes.headers['pragma'] = noCacheHeaders['Pragma']
            proxyRes.headers['expires'] = noCacheHeaders['Expires']
          })
        }
      },

      // proxy your API too (optional but recommended)
      '/api': {
        // target: 'http://localhost:8000',
        target: 'https://phdapi.khuriwalgroup.com',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['cache-control'] = noCacheHeaders['Cache-Control']
            proxyRes.headers['pragma'] = noCacheHeaders['Pragma']
            proxyRes.headers['expires'] = noCacheHeaders['Expires']
          })
        }
      },
    },
  },

  // Also disable cache when running `vite preview`
  preview: {
    headers: noCacheHeaders,
  }
})
