import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import indexHtml from '../../../index.html?raw'
import { detectLocale } from '../../i18n/locales'

// index.html sets the language and theme before the app loads, with small inline copies of
// detectLocale() and useTheme's stored-theme check. These run those copies against the app's
// own code, so the two can't drift apart.

const inlineScripts = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1])
const runInline = (needle: string) => {
  const code = inlineScripts.find(s => s.includes(needle))
  if (!code) throw new Error(`No inline script mentions ${needle}`)
  new Function(code)()
}

const root = document.documentElement

describe('index.html first-paint scripts', () => {
  beforeEach(() => {
    localStorage.clear()
    delete root.dataset.theme
    root.lang = ''
    document.head.innerHTML = '<meta name="theme-color" content="#0B1012">'
  })
  afterEach(() => { vi.restoreAllMocks() })

  describe('language', () => {
    const cases: [saved: string | null, browser: string][] = [
      [null, 'en-US'], [null, 'es-MX'], [null, 'ES'], [null, 'fr-FR'],
      ['es', 'en-US'], ['en', 'es-ES'], ['de', 'es-ES'], ['de', 'en-GB'],
    ]
    it.each(cases)('saved %s, browser %s: same language as detectLocale()', (saved, browser) => {
      if (saved) localStorage.setItem('locale', saved)
      vi.spyOn(navigator, 'language', 'get').mockReturnValue(browser)
      runInline('locale')
      expect(root.lang).toBe(detectLocale())
    })
  })

  describe('theme', () => {
    it.each([null, 'light', 'dark', 'sepia'])('saved %s: same theme and browser colour as useTheme', async (saved) => {
      if (saved) localStorage.setItem('theme', saved)
      runInline('theme')
      const inlineTheme = root.dataset.theme ?? 'dark'
      const inlineColor = document.querySelector('meta[name="theme-color"]')!.getAttribute('content')

      vi.resetModules()
      const { theme } = await import('../../composables/useTheme')   // applies itself on import
      expect(inlineTheme).toBe(theme.value)
      expect(inlineColor).toBe(document.querySelector('meta[name="theme-color"]')!.getAttribute('content'))
    })
  })
})
