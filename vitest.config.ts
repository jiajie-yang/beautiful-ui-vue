import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { fileURLToPath, URL } from 'node:url'
export default defineConfig({
 plugins:[vue(),vueJsx()],
 resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},
 test:{environment:'jsdom',setupFiles:['./tests/setup.ts'],include:['tests/**/*.test.ts'],testTimeout:10000},
})
