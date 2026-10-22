import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

// `npm run dev:lan` (mode 'lan') serves on the local network over HTTPS. Browsers only allow
// SharedArrayBuffer and the model cache on secure origins, and a LAN IP over plain HTTP isn't one,
// so the AI chat needs the (self-signed) certificate there.

/**
 * The site-wide (/*) headers from public/_headers, the file Cloudflare Pages serves them from,
 * so the dev and preview servers (and the e2e tests on them) send the same ones. HSTS is left
 * out: it only means something on the real HTTPS domain.
 */
function siteHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  let inSiteBlock = false
  for (const line of readFileSync(new URL('./public/_headers', import.meta.url), 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    if (!/^\s/.test(line)) { inSiteBlock = line.trim() === '/*'; continue }
    if (!inSiteBlock) continue
    const colon = line.indexOf(':')
    const name = line.slice(0, colon).trim()
    if (name.toLowerCase() !== 'strict-transport-security') headers[name] = line.slice(colon + 1).trim()
  }
  return headers
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  // The resume is also offered as a Word file
  assetsInclude: ['**/*.docx'],
  plugins: [
    vue(),
    mode === 'lan' && basicSsl(),
  ],
  // vue-i18n feature flags: Composition API only (drops the legacy API from the bundle), no
  // global <i18n-t> components, no devtools in production
  define: {
    __VUE_I18N_LEGACY_API__: 'false',
    __VUE_I18N_FULL_INSTALL__: 'false',
    __INTLIFY_PROD_DEVTOOLS__: 'false',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  clearScreen: false,
  server: {
    host: mode === 'lan' ? true : 'localhost',
    headers: siteHeaders(),
  },
  preview: {
    headers: siteHeaders(),
  },
  worker: {
    format: 'es',
  },
  build: {
    // wllama's chunk is ~920 kB and only loads when a visitor asks for the AI
    chunkSizeWarningLimit: 1000,
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
      // A floor a little under today's numbers (Oct 2026: 69% statements, 52% branches, 63%
      // functions, 72% lines), so a change that drops tests fails CI. Raise it as tests are added
      thresholds: { statements: 66, branches: 50, functions: 60, lines: 69 },
    },
  },
}))
