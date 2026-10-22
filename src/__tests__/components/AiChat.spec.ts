import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import AiChat from '../../components/AiChat/AiChat.vue'
import { i18n } from '../../i18n'
import { chatSectionInView } from '../../composables/useChat'
import type * as UseGame from '../../composables/useGame'

// The floating chat button, its popup, and the back-to-top button below it. The conversation
// itself is stubbed out; the chat panel and the game have their own tests.

vi.mock('../../composables/useGame', async (importOriginal) => ({
  ...await importOriginal<typeof UseGame>(),
  prefetchWhenIdle: vi.fn(),
}))

let wrapper: VueWrapper | null = null

function mountChat() {
  wrapper = mount(AiChat, {
    global: {
      plugins: [i18n],
      stubs: { ChatPanel: { template: '<div class="chat-panel" tabindex="-1" />' }, MiniGame: true },
    },
    attachTo: document.body,
  })
  const fab = () => wrapper!.find('button.fab')
  const dialog = () => wrapper!.find('[role="dialog"]')
  return { fab, dialog }
}

describe('AiChat', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    vi.stubGlobal('scrollTo', vi.fn())
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    chatSectionInView.value = false
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('opens the popup from the floating button and moves focus into it', async () => {
    const { fab, dialog } = mountChat()
    await fab().trigger('click')
    await nextTick()
    expect(dialog().exists()).toBe(true)
    expect(document.activeElement).toBe(dialog().element)
  })

  it('Escape closes the popup and puts focus back on the button', async () => {
    const { fab, dialog } = mountChat()
    await fab().trigger('click')
    await nextTick()
    await dialog().trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(dialog().exists()).toBe(false)
    expect(document.activeElement).toBe(fab().element)
  })

  it('shows back to top after a full screen of scrolling, and it returns focus to the top', async () => {
    mountChat()
    expect(wrapper!.find('.backtop').exists()).toBe(false)

    Object.defineProperty(window, 'scrollY', { value: window.innerHeight + 1, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    await nextTick()
    const header = document.createElement('header')
    header.innerHTML = '<a href="#home">Home</a>'
    document.body.prepend(header)

    await wrapper!.find('.backtop').trigger('click')
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })   // reduced motion
    expect(document.activeElement).toBe(header.querySelector('a'))
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  })

  it('steps aside while the chat section is on screen', async () => {
    const { fab } = mountChat()
    chatSectionInView.value = true
    await nextTick()
    expect(fab().isVisible()).toBe(false)
    chatSectionInView.value = false
    await nextTick()
    expect(fab().isVisible()).toBe(true)
  })

  it('closes the popup when the chat section scrolls into view, keeping focus in the conversation', async () => {
    const section = document.createElement('section')
    section.id = 'chat'
    section.innerHTML = '<div class="chat-panel" tabindex="-1"></div>'
    document.body.append(section)

    const { fab, dialog } = mountChat()
    await fab().trigger('click')
    await nextTick()
    chatSectionInView.value = true
    await nextTick()
    expect(dialog().exists()).toBe(false)
    expect(document.activeElement).toBe(section.querySelector('.chat-panel'))
  })
})
