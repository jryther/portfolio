import { describe, it, expect, beforeEach, vi } from 'vitest'

async function loadTheme() {
  vi.resetModules()
  return import('../../composables/useTheme')
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('defaults to dark when nothing is stored', async () => {
    const { theme } = await loadTheme()
    expect(theme.value).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('restores a saved light theme', async () => {
    localStorage.setItem('theme', 'light')
    const { theme } = await loadTheme()
    expect(theme.value).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('ignores unknown stored values', async () => {
    localStorage.setItem('theme', 'sepia')
    const { theme } = await loadTheme()
    expect(theme.value).toBe('dark')
  })

  it('toggleTheme flips the theme, updates <html> and persists the choice', async () => {
    const { theme, toggleTheme } = await loadTheme()
    toggleTheme()
    expect(theme.value).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')

    toggleTheme()
    expect(theme.value).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('adds a temporary transition class when switching', async () => {
    vi.useFakeTimers()
    const { setTheme } = await loadTheme()
    setTheme('light')
    expect(document.documentElement.classList.contains('theme-transition')).toBe(true)
    vi.advanceTimersByTime(1000)
    expect(document.documentElement.classList.contains('theme-transition')).toBe(false)
    vi.useRealTimers()
  })
})
