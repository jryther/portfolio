import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameAudio } from '../../game/flappyAudio'

// jsdom has no Web Audio. This stand-in records what the game builds and starts: every
// create*() returns a node whose params accept any automation, and the clock is set by hand.

const started: string[] = []
let contexts: FakeContext[] = []

function fakeParam() {
  const param = {
    value: 0,
    setValueAtTime: () => param,
    linearRampToValueAtTime: () => param,
    exponentialRampToValueAtTime: () => param,
    setTargetAtTime: () => param,
    cancelScheduledValues: () => param,
  }
  return param
}

function fakeNode(kind: string) {
  const params: Record<string, ReturnType<typeof fakeParam>> = {}
  const node: Record<string, unknown> = {
    kind,
    connect: (next: unknown) => next,
    disconnect: () => {},
    start: () => { started.push(kind) },
    stop: () => {},
  }
  // Any other property read (gain, frequency, Q, threshold...) is an AudioParam
  return new Proxy(node, {
    get: (target, key) => key in target || typeof key !== 'string' ? target[key as string] : (params[key] ??= fakeParam()),
  })
}

class FakeContext {
  state: AudioContextState = 'suspended'
  currentTime = 0
  sampleRate = 8000
  destination = fakeNode('destination')
  constructor() { contexts.push(this) }
  resume = vi.fn(() => { this.state = 'running'; return Promise.resolve() })
  suspend = vi.fn(() => { this.state = 'suspended'; return Promise.resolve() })
  close = vi.fn(() => { this.state = 'closed'; return Promise.resolve() })
  createBuffer = (channels: number, length: number) => ({ numberOfChannels: channels, length, getChannelData: () => new Float32Array(length) })
  createGain = () => fakeNode('gain')
  createOscillator = () => fakeNode('oscillator')
  createBiquadFilter = () => fakeNode('filter')
  createBufferSource = () => fakeNode('buffer')
  createConvolver = () => fakeNode('convolver')
  createDynamicsCompressor = () => fakeNode('compressor')
}

/** Moves the audio clock and lets the scheduler run */
function play(seconds: number) {
  for (let t = 0; t < seconds; t += 0.025) {
    contexts[0].currentTime += 0.025
    vi.advanceTimersByTime(25)
  }
}

const stepOf = (audio: GameAudio) => (audio as unknown as { step: number }).step

describe('GameAudio', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('AudioContext', FakeContext)
    started.length = 0
    contexts = []
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('creates nothing and plays nothing until the visitor unmutes', () => {
    const audio = new GameAudio('dark')
    audio.flap()
    audio.score(1)
    audio.crash()
    expect(contexts).toHaveLength(0)
    audio.dispose()
  })

  it('starts the music on unmute', () => {
    const audio = new GameAudio('dark')
    audio.setMuted(false)
    expect(contexts).toHaveLength(1)
    expect(contexts[0].resume).toHaveBeenCalled()
    play(2)
    expect(started.length).toBeGreaterThan(0)
    expect(stepOf(audio)).toBeGreaterThan(0)
    audio.dispose()
  })

  it('plays sound effects only while unmuted', () => {
    const audio = new GameAudio('light')
    audio.setMuted(false)
    started.length = 0
    audio.flap()
    expect(started).toEqual(['buffer'])

    audio.setMuted(true)
    started.length = 0
    audio.flap()
    audio.crash()
    expect(started).toEqual([])
    audio.dispose()
  })

  it('stops scheduling on mute, suspends the engine, and picks up where it left off', () => {
    const audio = new GameAudio('dark')
    audio.setMuted(false)
    play(2)
    audio.setMuted(true)
    const step = stepOf(audio)
    started.length = 0
    play(2)
    expect(started).toEqual([])
    expect(contexts[0].suspend).toHaveBeenCalled()

    audio.setMuted(false)
    expect(stepOf(audio)).toBe(step)   // not back to bar one
    play(1)
    expect(stepOf(audio)).toBeGreaterThan(step)
    expect(contexts).toHaveLength(1)   // the same engine, not a new one
    audio.dispose()
  })

  it("restarts from the top in the new theme's track when the theme changes while playing", () => {
    const audio = new GameAudio('dark')
    audio.setMuted(false)
    play(2)
    expect(stepOf(audio)).toBeGreaterThan(0)
    audio.setTheme('light')
    expect(stepOf(audio)).toBe(0)
    audio.dispose()
  })

  it('suspends while the tab is hidden', () => {
    const audio = new GameAudio('dark')
    audio.setMuted(false)
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(contexts[0].suspend).toHaveBeenCalled()

    Object.defineProperty(document, 'hidden', { value: false, configurable: true })
    contexts[0].resume.mockClear()
    document.dispatchEvent(new Event('visibilitychange'))
    expect(contexts[0].resume).toHaveBeenCalled()
    audio.dispose()
  })

  it('closes the engine and stops listening when disposed', () => {
    const audio = new GameAudio('dark')
    audio.setMuted(false)
    audio.dispose()
    expect(contexts[0].close).toHaveBeenCalled()

    contexts[0].suspend.mockClear()
    document.dispatchEvent(new Event('visibilitychange'))
    expect(contexts[0].suspend).not.toHaveBeenCalled()
  })
})
