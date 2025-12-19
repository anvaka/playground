import { createApp } from 'vue'
import App from './App.vue'
import { LLMPlugin } from '@anvaka/vue-llm'
import '@anvaka/vue-llm/dist/vue-llm.css'
import './style.css'

createApp(App)
  .use(LLMPlugin)
  .mount('#app')
