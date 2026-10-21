import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import './styles/main.css'
import AOS from 'aos'
import 'aos/dist/aos.css'

const app = createApp(App)

app.use(i18n)

// Initialize AOS (Animate On Scroll) — short, subtle reveals
app.use({
  install() {
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      offset: 60,
      once: true,
      disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    })
  }
})

app.mount('#app')
