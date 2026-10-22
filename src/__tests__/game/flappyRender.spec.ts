import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FlappyRenderer } from '../../game/flappyRender'
import { FlappySim, WORLD_H } from '../../game/flappySim'

// jsdom has no canvas drawing. Every 2D context here records the calls made on it, so the tests
// check what the renderer draws (and where), not pixels.

interface Call { name: string, args: unknown[] }

function recordingContext(calls: Call[]) {
  const state: Record<string, unknown> = {}
  return new Proxy(state, {
    get: (target, key) => {
      if (typeof key !== 'string' || key in target) return target[key as string]
      return (...args: unknown[]) => {
        calls.push({ name: key, args })
        if (key.startsWith('create')) return { addColorStop: () => {} }
        if (key === 'measureText') return { width: 0 }
      }
    },
    set: (target, key, value) => { target[key as string] = value; return true },
  })
}

let mainCalls: Call[]
let mainCanvas: HTMLCanvasElement

function setup(cssW = 400, cssH = 300) {
  mainCanvas = document.createElement('canvas')
  const renderer = new FlappyRenderer(mainCanvas)
  const worldW = renderer.resize(cssW, cssH)
  mainCalls.length = 0   // building the background draws on its own canvases; keep the frame only
  return { renderer, worldW }
}

const drawImages = () => mainCalls.filter(c => c.name === 'drawImage')
const texts = () => mainCalls.filter(c => c.name === 'fillText').map(c => c.args[0])

describe('FlappyRenderer', () => {
  beforeEach(() => {
    mainCalls = []
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
      return recordingContext(this === mainCanvas ? mainCalls : []) as unknown as CanvasRenderingContext2D
    } as unknown as typeof HTMLCanvasElement.prototype.getContext)
    vi.stubGlobal('Path2D', class { moveTo() {} lineTo() {} closePath() {} arc() {} ellipse() {} rect() {} })
    vi.stubGlobal('devicePixelRatio', 1)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('throws when the browser gives no 2D context, so the game can say it cannot run', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null)
    expect(() => new FlappyRenderer(document.createElement('canvas'))).toThrow('Canvas 2D is not available')
  })

  it('sizes the canvas in device pixels, capped at 2x', () => {
    vi.stubGlobal('devicePixelRatio', 3)
    const { worldW } = setup(400, 300)
    expect(mainCanvas.width).toBe(800)
    expect(mainCanvas.height).toBe(600)
    // The world is always WORLD_H tall; its width follows the canvas shape
    expect(worldW).toBeCloseTo(400 * (WORLD_H / 300))
  })

  it('uses 1.5x on low-memory devices', () => {
    vi.stubGlobal('devicePixelRatio', 3)
    vi.stubGlobal('navigator', { ...navigator, deviceMemory: 4 })
    setup(400, 300)
    expect(mainCanvas.width).toBe(600)
  })

  it('draws the sky, the background layers and the obstacles each frame', () => {
    const { renderer, worldW } = setup()
    const sim = new FlappySim(worldW, 1)
    sim.columns.push({ x: 200, gapTop: 150, passed: false })
    renderer.render(sim)
    // Sky first, then six layers, each drawn once or twice to tile across the view
    expect(drawImages().length).toBeGreaterThanOrEqual(7)
    expect(drawImages()[0].args.slice(1)).toEqual([0, 0])
    expect(mainCalls.some(c => c.name === 'fill' || c.name === 'fillRect')).toBe(true)
  })

  it('shows the score only during a round', () => {
    const { renderer, worldW } = setup()
    const sim = new FlappySim(worldW, 1)
    renderer.render(sim)
    expect(texts()).toEqual([])

    sim.flap()   // starts the round
    sim.score = 3
    mainCalls.length = 0
    renderer.render(sim)
    expect(texts()).toEqual(['3', '3'])   // shadow, then the number
  })

  it('holds the clouds still with reduced motion', () => {
    const { renderer, worldW } = setup()
    const sim = new FlappySim(worldW, 1)
    const cloudX = () => {
      mainCalls.length = 0
      renderer.render(sim)
      return drawImages()[1].args[1]   // the first layer after the sky
    }

    sim.calm = true
    const still = cloudX()
    sim.time += 10
    expect(cloudX()).toBe(still)

    sim.calm = false
    expect(cloudX()).not.toBe(still)
  })
})
