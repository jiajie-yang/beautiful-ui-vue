import { createApp } from 'vue'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import './styles/globals.css'
import './styles/site.css'
import App from './App.vue'
import { router } from './router'
import { i18n } from './lib/i18n'

createApp(App).use(i18n).use(router).mount('#app')
