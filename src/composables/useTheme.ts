import { ref } from 'vue'

export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'theme'

// Browser chrome colour per theme — mirrors --color-charcoal in main.css
const THEME_COLORS: Record<Theme, string> = {
  dark:  '#0B1012',
  light: '#F5F3EC',
}

// Dark is the default; only an explicit saved choice switches to light.
// (index.html applies the saved theme before first paint to avoid a flash.)
function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export const theme = ref<Theme>(readStoredTheme())

let transitionTimer: ReturnType<typeof setTimeout> | null = null

function applyTheme(next: Theme, animate: boolean) {
  const root = document.documentElement

  // Briefly enable colour transitions on everything so the swap fades instead of snapping
  if (animate) {
    root.classList.add('theme-transition')
    if (transitionTimer) clearTimeout(transitionTimer)
    transitionTimer = setTimeout(() => root.classList.remove('theme-transition'), 900)
  }

  root.dataset.theme = next
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[next])
}

export function setTheme(next: Theme) {
  theme.value = next
  applyTheme(next, true)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // Storage unavailable (private mode, blocked) — theme still applies for this visit
  }
}

export function toggleTheme() {
  setTheme(theme.value === 'dark' ? 'light' : 'dark')
}

if (typeof document !== 'undefined') applyTheme(theme.value, false)
