import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import AOS from 'aos'
import 'aos/dist/aos.css'

const app = createApp(App)

// Initialize AOS (Animate On Scroll)
app.use({
  install() {
    AOS.init({
      duration: 1000,
      offset: 100,
      once: true,
    })
  }
})

app.mount('#app')
