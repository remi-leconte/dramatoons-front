//import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './assets/base.css'
import { createPreloadErrorHandler, trackRequestedPath } from './services/reloadOnUpdate'

const app = createApp(App)

app.use(createPinia())
app.use(router)

const requestedPath = trackRequestedPath(
  router,
  window.location.pathname + window.location.search + window.location.hash,
)
window.addEventListener(
  'vite:preloadError',
  createPreloadErrorHandler(() => window.location.assign(requestedPath())),
)

app.mount('#app')
