import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, ref, withDirectives, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { vTooltip, type TooltipValue } from '../../directives/tooltip'

// jsdom has no PointerEvent; the directive only reads pointerType and relatedTarget
function pointer(type: string, pointerType = 'mouse', relatedTarget: EventTarget | null = null) {
  return Object.assign(new Event(type), { pointerType, relatedTarget })
}

function mountButton(value: TooltipValue, attrs: Record<string, string> = {}, text = '') {
  const tip = ref<TooltipValue>(value)
  const wrapper = mount(defineComponent({
    setup: () => () => withDirectives(h('button', attrs, text), [[vTooltip, tip.value]]),
  }), { attachTo: document.body })
  const button = wrapper.element as HTMLButtonElement
  const tooltips = () => [...document.querySelectorAll<HTMLElement>('[role="tooltip"]')]
  return { wrapper, button, tip, tooltip: () => tooltips()[tooltips().length - 1] }
}

describe('v-tooltip', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('renders a hidden role="tooltip" element with the text', () => {
    const { tooltip } = mountButton('Switch to dark mode', { 'aria-label': 'Switch to dark mode' })
    expect(tooltip().hidden).toBe(true)
    expect(tooltip().getAttribute('role')).toBe('tooltip')
  })

  it('hides itself from screen readers when it only repeats the accessible name', () => {
    const { button, tooltip } = mountButton('Close', { 'aria-label': 'Close' })
    expect(tooltip().getAttribute('aria-hidden')).toBe('true')
    expect(button.hasAttribute('aria-describedby')).toBe(false)
  })

  it('describes the trigger when it adds to the accessible name', () => {
    const { button, tooltip } = mountButton('A 330 MB one-time download', {}, 'Load AI')
    expect(tooltip().hasAttribute('aria-hidden')).toBe(false)
    expect(button.getAttribute('aria-describedby')).toBe(tooltip().id)
    // Screen readers read the description from the hidden tooltip, before it ever shows
    expect(tooltip().hidden).toBe(true)
    expect(tooltip().textContent).toBe('A 330 MB one-time download')
  })

  it('keeps an existing aria-describedby', () => {
    const { button, tooltip } = mountButton('More details', { 'aria-describedby': 'hint' }, 'Send')
    expect(button.getAttribute('aria-describedby')).toBe(`hint ${tooltip().id}`)
  })

  it('shows on mouse hover after a short delay, then hides when the pointer leaves', () => {
    const { button, tooltip } = mountButton('Play a game', { 'aria-label': 'Play a game' })
    button.dispatchEvent(pointer('pointerenter'))
    vi.advanceTimersByTime(200)
    expect(tooltip().hidden).toBe(true)
    vi.advanceTimersByTime(300)
    expect(tooltip().hidden).toBe(false)
    expect(tooltip().textContent).toBe('Play a game')

    button.dispatchEvent(pointer('pointerleave'))
    vi.advanceTimersByTime(200)
    expect(tooltip().hidden).toBe(true)
  })

  it('stays up while the pointer moves onto the tooltip (hoverable)', () => {
    const { button, tooltip } = mountButton('Play a game', { 'aria-label': 'Play a game' })
    button.dispatchEvent(pointer('pointerenter'))
    vi.advanceTimersByTime(500)
    button.dispatchEvent(pointer('pointerleave', 'mouse', tooltip()))
    tooltip().dispatchEvent(pointer('pointerenter'))
    vi.advanceTimersByTime(500)
    expect(tooltip().hidden).toBe(false)
  })

  it('never shows for touch', () => {
    const { button, tooltip } = mountButton('Play a game', { 'aria-label': 'Play a game' })
    button.dispatchEvent(pointer('pointerenter', 'touch'))
    vi.advanceTimersByTime(1000)
    expect(tooltip().hidden).toBe(true)
  })

  it('hides when the control is pressed', () => {
    const { button, tooltip } = mountButton('Play a game', { 'aria-label': 'Play a game' })
    button.dispatchEvent(pointer('pointerenter'))
    vi.advanceTimersByTime(500)
    button.dispatchEvent(pointer('pointerdown'))
    expect(tooltip().hidden).toBe(true)
  })

  it('Escape dismisses it without reaching other Escape handlers', () => {
    const { button, tooltip } = mountButton('Close chat', { 'aria-label': 'Close chat' })
    const otherHandler = vi.fn()
    window.addEventListener('keydown', otherHandler)
    button.dispatchEvent(pointer('pointerenter'))
    vi.advanceTimersByTime(500)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(tooltip().hidden).toBe(true)
    expect(otherHandler).not.toHaveBeenCalled()

    // With nothing showing, Escape goes through as usual
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(otherHandler).toHaveBeenCalledTimes(1)
    window.removeEventListener('keydown', otherHandler)
  })

  it('follows text changes, including while showing', async () => {
    const { button, tip, tooltip } = mountButton('Switch to dark mode')
    button.dispatchEvent(pointer('pointerenter'))
    vi.advanceTimersByTime(500)
    tip.value = 'Switch to light mode'
    await nextTick()
    expect(tooltip().textContent).toBe('Switch to light mode')
  })

  it('hides instead of showing an empty box when its text is cleared', async () => {
    const { button, tip, tooltip } = mountButton('Play a game')
    button.dispatchEvent(pointer('pointerenter'))
    vi.advanceTimersByTime(500)
    expect(tooltip().hidden).toBe(false)
    tip.value = ''
    await nextTick()
    expect(tooltip().hidden).toBe(true)
  })

  it('removes its tooltip when the element goes away', () => {
    const { wrapper } = mountButton('Close', { 'aria-label': 'Close' })
    expect(document.querySelectorAll('[role="tooltip"]')).toHaveLength(1)
    wrapper.unmount()
    expect(document.querySelectorAll('[role="tooltip"]')).toHaveLength(0)
  })
})
