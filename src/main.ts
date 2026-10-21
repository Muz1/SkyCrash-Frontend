import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import './style.css'
import { applyStoredTextSize } from './composables/useTextSize'

// Accessibility: the saved text size applies before the first render.
applyStoredTextSize()

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')