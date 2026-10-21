// The site's languages. Kept apart from vue-i18n so plain data modules (the chat tree, its
// router) can be locale-aware without pulling in the i18n runtime.
export const LOCALES = ['en', 'es'] as const
export type Locale = typeof LOCALES[number]

export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_STORAGE_KEY = 'locale'

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale)
}

// A saved choice wins; otherwise Spanish-language browsers get Spanish, everyone else English.
// (index.html runs the same check before first paint to set <html lang>.)
export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(saved)) return saved
  } catch {
    // Storage unavailable (private mode, blocked): fall through to the browser language
  }
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('es')) return 'es'
  return DEFAULT_LOCALE
}
