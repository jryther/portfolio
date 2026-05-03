import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/portfolio-v3/',
  plugins: [
    tailwindcss(),
    vue(),
  ],
  assetsInclude: ['**/*.docx'],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  clearScreen: false,
  server: {
    host: 'localhost',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'web-llm': ['@mlc-ai/web-llm'],
        },
      },
    },
    chunkSizeWarningLimit: 3000,
  },
})
