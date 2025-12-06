import { createApp } from 'vue'
import App from './App.vue'
import { LLMPlugin } from '@anvaka/vue-llm'
import '@anvaka/vue-llm/styles/variables.css'
import './style.css'

createApp(App)
  .use(LLMPlugin)
  .mount('#app')
