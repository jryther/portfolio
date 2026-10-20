import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

// `npm run dev:lan` (mode 'lan') serves on the local network over HTTPS. Browsers only allow
// SharedArrayBuffer and the model cache on secure origins, and a LAN IP over plain HTTP isn't one,
// so the AI chat needs the (self-signed) certificate there.

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  plugins: [
    tailwindcss(),
    vue(),
    mode === 'lan' && basicSsl(),
  ],
  assetsInclude: ['**/*.docx'],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  clearScreen: false,
  server: {
    host: mode === 'lan' ? true : 'localhost',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  worker: {
    format: 'es',
  },
  build: {
    chunkSizeWarningLimit: 3000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{spec,test}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/services/wllama.ts', 'src/main.ts'],
    },
  },
}))
