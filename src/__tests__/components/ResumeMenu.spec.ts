import { describe, it, expect, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import ResumeMenu from '../../components/ResumeMenu.vue'
import { i18n } from '../../i18n'

// The WAI-ARIA menu button pattern. The e2e spec covers the same in a real browser; these
// cover each key and the download/view links

let wrapper: VueWrapper | null = null

function mountMenu(props: Record<string, unknown> = {}) {
  wrapper = mount(ResumeMenu, {
    props,
    slots: { default: 'Resume' },
    global: { plugins: [i18n] },
    attachTo: document.body,
  })
  const button = wrapper.find('button')
  const items = () => wrapper!.findAll('[role="menuitem"]')
  const focused = () => (document.activeElement as HTMLElement | null)?.textContent?.trim()
  const key = async (k: string) => {
    const target = document.activeElement === button.element ? button : wrapper!.find(':focus')
    await target.trigger('keydown', { key: k })
    await wrapper!.vm.$nextTick()
  }
  return { button, items, focused, key }
}

describe('ResumeMenu', () => {
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('is a closed menu button to start', () => {
    const { button } = mountMenu()
    expect(button.attributes('aria-haspopup')).toBe('menu')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-controls')).toBe(wrapper!.find('[role="menu"]').attributes('id'))
  })

  it('opens on the first format when clicked', async () => {
    const { button, focused } = mountMenu()
    await button.trigger('click')
    await wrapper!.vm.$nextTick()
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(focused()).toMatch(/^PDF/)
  })

  it('ArrowUp on the button opens on the last format', async () => {
    const { button, focused, key } = mountMenu()
    ;(button.element as HTMLButtonElement).focus()
    await key('ArrowUp')
    expect(focused()).toMatch(/^Word/)
  })

  it('arrow keys wrap around, and Home and End jump to the ends', async () => {
    const { button, focused, key } = mountMenu()
    ;(button.element as HTMLButtonElement).focus()
    await key('ArrowDown')
    expect(focused()).toMatch(/^PDF/)
    await key('ArrowDown')
    expect(focused()).toMatch(/^Word/)
    await key('ArrowDown')
    expect(focused()).toMatch(/^PDF/)
    await key('ArrowUp')
    expect(focused()).toMatch(/^Word/)
    await key('Home')
    expect(focused()).toMatch(/^PDF/)
    await key('End')
    expect(focused()).toMatch(/^Word/)
  })

  it('Escape closes it and returns focus to the button', async () => {
    const { button, key } = mountMenu()
    ;(button.element as HTMLButtonElement).focus()
    await key('ArrowDown')
    await key('Escape')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button.element)
  })

  it('opens the PDF in a new tab by default, and downloads the Word file', () => {
    const { items } = mountMenu()
    const [pdf, docx] = items()
    expect(pdf.attributes('target')).toBe('_blank')
    expect(pdf.attributes('rel')).toBe('noreferrer')
    expect(pdf.attributes('download')).toBeUndefined()
    expect(docx.attributes('download')).toBe('Joshua_Ryther_Resume.docx')
  })

  it('downloads the PDF too when asked', () => {
    const { items } = mountMenu({ pdfAction: 'download' })
    expect(items()[0].attributes('download')).toBe('Joshua_Ryther_Resume.pdf')
    expect(items()[0].attributes('target')).toBeUndefined()
  })

  it('closes when the pointer goes down outside it', async () => {
    const { button } = mountMenu()
    await button.trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await wrapper!.vm.$nextTick()
    expect(button.attributes('aria-expanded')).toBe('false')
  })
})
