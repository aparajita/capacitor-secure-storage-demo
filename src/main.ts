import { Capacitor } from '@capacitor/core'
import { IonicVue } from '@ionic/vue'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Theme variables */
import './theme/variables.css'
import './assets/css/styles.pcss'

const config: Record<string, unknown> = {}

if (Capacitor.getPlatform() === 'web') {
  config.mode = 'ios'
}

const app = createApp(App).use(IonicVue, config).use(router)

router
  .isReady()
  .then(() => {
    app.mount('#app')
  })
  .catch((error) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    console.error((error as Error).message)
  })
