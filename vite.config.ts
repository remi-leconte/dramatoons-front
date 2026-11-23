import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // Version inscrite à la construction de l'image (APP_VERSION, passée par publish.yml) : elle fait partie de
  // l'image, livrée telle quelle en production, et n'est pas un réglage lu au démarrage comme config.js
  define: {
    __APP_VERSION__: JSON.stringify(process.env.APP_VERSION || 'dev'),
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ["dramatoons.local"],
    watch: {
      usePolling: true,
    },
  },
})
