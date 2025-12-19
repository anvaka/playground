import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  publicDir: 'data',
  server: {
    // Handle SPA routes like /explore
    historyApiFallback: true
  },
  // Ensure all routes fall back to index.html for SPA
  appType: 'spa'
})
