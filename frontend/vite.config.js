import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { writeFileSync } from 'fs'

// Stamped once per build (or dev server start).
// The running app polls /version.json and logs out users when it changes.
const BUILD_VERSION = Date.now().toString()

function versionPlugin() {
  return {
    name: 'kimawa-version',
    buildStart() {
      writeFileSync('public/version.json', JSON.stringify({ v: BUILD_VERSION }))
    },
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(BUILD_VERSION),
  },
  plugins: [
    react(),
    tailwindcss(),
    versionPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/pwa-192.png', 'icons/pwa-512.png'],
      manifest: {
        name: 'Kimawa',
        short_name: 'Kimawa',
        description: 'Book beauty appointments in Zambia',
        theme_color: '#6B2737',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor'
            }
            if (id.includes('@apollo/client') || id.includes('graphql')) {
              return 'apollo'
            }
          }
        },
      },
    },
  },
})
