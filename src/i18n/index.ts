import { createI18n } from 'vue-i18n'
import en, { type MessageSchema } from './en'
import es from './es'
import { LOCALE_STORAGE_KEY, detectLocale, type Locale } from './locales'

export { LOCALES, type Locale } from './locales'

export const i18n = createI18n<[MessageSchema], Locale, false>({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { en, es },
})

/** The current language. Writable, but use setLocale so <html lang> and storage follow */
export const locale = i18n.global.locale

// Keep the document (lang, title, description) in step with the UI language
function applyLocale(next: Locale) {
  const { t } = i18n.global
  document.documentElement.lang = next
  document.title = t('meta.title')
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'))
}

type Rendered<T> = T extends string ? string : { [K in keyof T]: string }

/**
 * A list of messages (strings, or objects of strings) rendered in the current language.
 * Empty when the key has no list. (Check lists this way, not with te(): te() is false for
 * arrays.) Call it inside a computed so it follows language changes.
 */
export function messageList<T extends string | object = string>(key: string): Rendered<T>[] {
  const { tm, rt } = i18n.global
  const raw: unknown = tm(key)
  if (!Array.isArray(raw)) return []
  return raw.map(item => typeof item === 'object'
    ? Object.fromEntries(Object.entries(item).map(([k, v]) => [k, rt(v as string)]))
    : rt(item)) as Rendered<T>[]
}

export function setLocale(next: Locale) {
  locale.value = next
  applyLocale(next)
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, next)
  } catch {
    // Storage unavailable (private mode, blocked): the language still applies for this visit
  }
}

export function toggleLocale() {
  setLocale(locale.value === 'en' ? 'es' : 'en')
}

if (typeof document !== 'undefined') applyLocale(locale.value)
