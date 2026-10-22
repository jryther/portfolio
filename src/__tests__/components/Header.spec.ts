import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import Header from '../../components/Header.vue'
import { i18n } from '../../i18n'

// jsdom has neither IntersectionObserver nor matchMedia; these stand-ins let a test play the
// part of the browser: a section scrolling into view, the window widening past phone size

let observed: (entries: Partial<IntersectionObserverEntry>[]) => void
let phoneChange: ((e: { matches: boolean }) => void) | null

let wrapper: VueWrapper | null = null

function mountHeader() {
  wrapper = mount(Header, { global: { plugins: [i18n] }, attachTo: document.body })
  const menuButton = wrapper.find('button.menu')
  const nav = wrapper.find('#site-nav')
  const isOpen = () => menuButton.attributes('aria-expanded') === 'true'
  return { menuButton, nav, isOpen }
}

describe('Header', () => {
  beforeEach(() => {
    phoneChange = null
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: (entries: Partial<IntersectionObserverEntry>[]) => void) { observed = callback }
      observe() {}
      disconnect() {}
    })
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => { phoneChange = fn },
      removeEventListener: () => { phoneChange = null },
    }))
    // The sections the nav highlights
    document.body.innerHTML = ['home', 'about', 'projects', 'chat', 'contact'].map(id => `<section id="${id}"></section>`).join('')
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('opens and closes the phone menu from its button', async () => {
    const { menuButton, nav, isOpen } = mountHeader()
    expect(menuButton.attributes('aria-controls')).toBe('site-nav')
    expect(isOpen()).toBe(false)
    await menuButton.trigger('click')
    expect(isOpen()).toBe(true)
    expect(nav.classes()).toContain('active')
    await menuButton.trigger('click')
    expect(isOpen()).toBe(false)
  })

  it('Escape closes the menu and returns focus to its button', async () => {
    const { menuButton, isOpen } = mountHeader()
    await menuButton.trigger('click')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper!.vm.$nextTick()
    expect(isOpen()).toBe(false)
    expect(document.activeElement).toBe(menuButton.element)
  })

  it('choosing a section closes the menu', async () => {
    const { menuButton, nav, isOpen } = mountHeader()
    await menuButton.trigger('click')
    await nav.find('a[href="#about"]').trigger('click')
    expect(isOpen()).toBe(false)
  })

  it('closes the menu when the window widens past phone size', async () => {
    const { menuButton, isOpen } = mountHeader()
    await menuButton.trigger('click')
    phoneChange!({ matches: false })
    await wrapper!.vm.$nextTick()
    expect(isOpen()).toBe(false)
  })

  it('stops listening for the window size once it is gone', () => {
    mountHeader()
    expect(phoneChange).not.toBeNull()
    wrapper!.unmount()
    wrapper = null
    expect(phoneChange).toBeNull()
  })

  it('marks the section on screen as the current one', async () => {
    const { nav } = mountHeader()
    observed([{ isIntersecting: true, target: document.getElementById('projects')! }])
    await wrapper!.vm.$nextTick()
    expect(nav.find('a[href="#projects"]').attributes('aria-current')).toBe('true')
    expect(nav.find('a[href="#about"]').attributes('aria-current')).toBeUndefined()
  })
})
