import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const VUE_LLM_PATH = '/Users/anvaka/projects/research-tree/packages/vue-llm/src'

export default defineConfig({
  plugins: [vue()],
  base: './',
  publicDir: 'data',
  resolve: {
    alias: {
      '@anvaka/vue-llm/styles/variables.css': `${VUE_LLM_PATH}/styles/variables.css`,
      '@anvaka/vue-llm': `${VUE_LLM_PATH}/index.js`
    }
  }
})
