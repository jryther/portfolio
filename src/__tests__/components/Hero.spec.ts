import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import Hero from '../../components/Hero.vue'
import { i18n } from '../../i18n'
import { scenePaused } from '../../composables/useScene'
import { prefersReducedMotion } from '../../composables/useReducedMotion'
import { CONTACT_EMAIL, LINKEDIN_URL, GITHUB_URL } from '../../data/contact'

// jsdom can't draw on a canvas, so each weather layer fails to start, which the hero logs and
// carries on without. The log shows which layers it tried to start, and when.

let wrapper: VueWrapper | null = null
let warn: { mock: { calls: unknown[][] } }
const rainAttempts = () => warn.mock.calls.filter((args: unknown[]) => args.some(a => String(a).includes('Rain could not start'))).length

function mountHero() {
  wrapper = mount(Hero, { global: { plugins: [i18n] }, attachTo: document.body })
  return wrapper
}

describe('Hero', () => {
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} })
    scenePaused.value = false
    prefersReducedMotion.value = false
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    scenePaused.value = false
    prefersReducedMotion.value = false
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders without the weather when canvas drawing is unavailable', () => {
    const hero = mountHero()
    expect(hero.find('h1').text()).toBe('Josh Ryther')
    expect(rainAttempts()).toBe(1)
  })

  it('links to LinkedIn, GitHub and email from the shared contact details', () => {
    const hero = mountHero()
    expect(hero.find(`a[href="${LINKEDIN_URL}"]`).exists()).toBe(true)
    expect(hero.find(`a[href="${GITHUB_URL}"]`).exists()).toBe(true)
    expect(hero.find(`a[href="mailto:${CONTACT_EMAIL}"]`).exists()).toBe(true)
  })

  it('stops the status dot pulsing while the scene is paused', async () => {
    const hero = mountHero()
    const dot = hero.find('.status-dot')
    expect(dot.classes()).not.toContain('is-still')
    scenePaused.value = true
    await nextTick()
    expect(dot.classes()).toContain('is-still')
  })

  it('never starts the rain with reduced motion, and starts it when that is turned off', async () => {
    prefersReducedMotion.value = true
    mountHero()
    expect(rainAttempts()).toBe(0)
    prefersReducedMotion.value = false
    await nextTick()
    expect(rainAttempts()).toBe(1)
  })
})
