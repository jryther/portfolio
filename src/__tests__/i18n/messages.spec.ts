import { describe, it, expect } from 'vitest'
import en from '../../i18n/en'
import es from '../../i18n/es'
import { i18n } from '../../i18n'

// Every key path in a message tree, with array lengths as part of the shape
function shape(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) return [`${path}[${value.length}]`, ...value.flatMap((v, i) => shape(v, `${path}[${i}]`))]
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k))
  return [path]
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings)
  return []
}

describe('UI messages', () => {
  it('has the same keys and list lengths in Spanish as in English', () => {
    expect(shape(es)).toEqual(shape(en))
  })

  it('has no untranslated or empty Spanish text', () => {
    const enStrings = new Set(strings(en))
    // Names, codes and figures that are the same in both languages
    const same = new Set(['Frontend', 'LinkedIn', '2020 — 2022', '2009 — 2014', 'WCAG AA', 'WCAG 2.1 AA accessibility compliance'])
    for (const text of strings(es)) {
      expect(text.trim(), 'empty message').not.toBe('')
      if (enStrings.has(text) && !same.has(text)) expect.soft(text, 'same as English').toBe('(translated)')
    }
  })

  it('compiles every message in both languages', () => {
    for (const locale of ['en', 'es'] as const) {
      const { t, te } = i18n.global
      for (const key of shape(locale === 'en' ? en : es).filter(k => !k.includes('['))) {
        expect(te(key, locale), key).toBe(true)
        expect(() => t(key, {}, { locale }), key).not.toThrow()
      }
    }
  })

  it('renders a literal @ in the email placeholder', () => {
    expect(i18n.global.t('form.emailPlaceholder', {}, { locale: 'es' })).toBe('ana@empresa.com')
  })

  // A bare | is vue-i18n's plural separator and would cut the title off
  it('renders the page title whole', () => {
    expect(i18n.global.t('meta.title', {}, { locale: 'en' })).toBe('Josh Ryther | Full-Stack Software Engineer')
    expect(i18n.global.t('meta.title', {}, { locale: 'es' })).toBe('Josh Ryther | Ingeniero de software full-stack')
  })
})
