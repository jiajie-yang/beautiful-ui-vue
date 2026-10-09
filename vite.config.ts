import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { subscriptionPlugin } from './server/vite-plugin.mjs'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), vueJsx(), tailwindcss(), subscriptionPlugin()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: '127.0.0.1' },
})
