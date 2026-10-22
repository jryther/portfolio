import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '../../i18n'
import { notices, dismiss } from '../../services/errors'

// Web Audio that can't start, to check a sound failure only turns the sound off
const instances: { setMuted: ReturnType<typeof vi.fn>, dispose: ReturnType<typeof vi.fn> }[] = []
vi.mock('../../game/flappyAudio', () => ({
  GameAudio: class {
    setMuted = vi.fn(() => { throw new Error('AudioContext blocked') })
    dispose = vi.fn()
    setTheme = vi.fn()
    constructor() { instances.push(this) }
  },
}))

describe('MiniGame sound', () => {
  afterEach(() => {
    notices.value.forEach(n => dismiss(n.id))
    vi.restoreAllMocks()
  })

  it('re-mutes, swaps in fresh audio, and says sound is unavailable', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // jsdom has no canvas; the game shows its own "can't run" message, and the sound button still works
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { default: MiniGame } = await import('../../components/AiChat/MiniGame.vue')
    const wrapper = mount(MiniGame, { global: { plugins: [i18n] } })

    const button = wrapper.find('.icon-btn')
    await button.trigger('click')

    expect(button.attributes('aria-label')).toBe('Turn sound on')
    expect(instances).toHaveLength(2)
    expect(instances[0].dispose).toHaveBeenCalled()
    expect(notices.value.map(n => n.messageKey)).toEqual(['notices.soundUnavailable'])
    expect(wrapper.find('.game-failed').exists()).toBe(true)
    wrapper.unmount()
  })

  it('leaves keys from controls inside the stage alone', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { default: MiniGame } = await import('../../components/AiChat/MiniGame.vue')
    const wrapper = mount(MiniGame, { global: { plugins: [i18n] } })
    await wrapper.vm.$nextTick()   // renders the "can't run" panel, a stand-in for an inner control

    const space = () => new KeyboardEvent('keydown', { code: 'Space', bubbles: true, cancelable: true })
    // A key on the stage itself is the game's (no page scroll)...
    const onStage = space()
    wrapper.find('.stage').element.dispatchEvent(onStage)
    expect(onStage.defaultPrevented).toBe(true)
    // ...but one bubbling up from inside (like the Play again button) keeps its default action
    const inside = space()
    wrapper.find('.game-failed').element.dispatchEvent(inside)
    expect(inside.defaultPrevented).toBe(false)
    wrapper.unmount()
  })
})
