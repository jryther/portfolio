import { describe, it, expect } from 'vitest'
import { FlappySim, WORLD_H, GROUND_H, BIRD_R, STEP, COLUMN_W } from '../../game/flappySim'

// Play the same inputs (flap at fixed times) at a given frame rate
function play(fps: number, seconds: number, flapEvery = 0.45, worldW = 800) {
  const sim = new FlappySim(worldW, 42)
  const dt = 1 / fps
  let t = 0
  let nextFlap = 0
  while (t < seconds) {
    if (t >= nextFlap) { sim.flap(); nextFlap += flapEvery }
    sim.advance(dt)
    t += dt
  }
  return sim
}

describe('FlappySim', () => {
  it('plays the same at different frame rates', () => {
    const at30 = play(30, 3)
    const at60 = play(60, 3)
    const at144 = play(144, 3)
    // Flaps land on frame boundaries, so allow a few ticks of difference
    expect(Math.abs(at30.birdY - at144.birdY)).toBeLessThan(25)
    expect(Math.abs(at60.birdY - at144.birdY)).toBeLessThan(15)
    expect(Math.abs(at30.camX - at144.camX)).toBeLessThan(10)
    expect(at30.phase).toBe(at144.phase)
  })

  it('advances in fixed ticks and keeps the remainder for interpolation', () => {
    const sim = new FlappySim(800, 1)
    sim.advance(STEP * 2.5)
    expect(sim.alpha).toBeCloseTo(0.5, 5)
  })

  it('does not fast-forward after a long stall', () => {
    const sim = new FlappySim(800, 1)
    sim.flap()
    sim.advance(5)
    expect(sim.camX).toBeLessThan(0.3 * 300)
  })

  it('places the same columns for the same seed', () => {
    const a = play(60, 2.5)
    const b = play(60, 2.5)
    expect(a.columns.map(c => c.gapTop)).toEqual(b.columns.map(c => c.gapTop))
  })

  it('keeps every opening clear of the ceiling and ground', () => {
    const sim = new FlappySim(800, 7)
    sim.flap()
    for (let i = 0; i < 2000; i++) { if (i % 50 === 0) sim.flap(); sim.advance(STEP) }
    for (const c of sim.columns) {
      expect(c.gapTop).toBeGreaterThan(0)
      expect(c.gapTop).toBeLessThan(WORLD_H - GROUND_H)
    }
  })

  it('crashes into the ground without flapping, then settles as dead', () => {
    const sim = new FlappySim(800, 3)
    sim.flap()
    let died = false
    for (let i = 0; i < 600; i++) died = sim.advance(STEP).died || died
    expect(died).toBe(true)
    expect(sim.phase).toBe('dead')
    expect(sim.birdY).toBeCloseTo(WORLD_H - GROUND_H - BIRD_R, 5)
    expect(sim.flap()).toBe(false)
  })

  it('is beatable: a simple autopilot clears 15 columns', () => {
    for (const seed of [1, 2, 3]) {
      const sim = new FlappySim(800, seed)
      sim.flap()
      for (let i = 0; i < 120 * 60 && sim.score < 15 && sim.phase === 'playing'; i++) {
        const next = sim.columns.find(c => c.x + 70 > sim.camX + sim.birdX - BIRD_R)
        const target = next ? next.gapTop + 130 : 300
        if (sim.birdY > target && sim.vy > 0) sim.flap()
        sim.advance(STEP)
      }
      expect(sim.score, `seed ${seed}`).toBeGreaterThanOrEqual(15)
    }
  })

  it('bobs in place before the first flap', () => {
    const sim = new FlappySim(800, 3)
    sim.advance(2)
    expect(sim.phase).toBe('idle')
    expect(sim.columns).toHaveLength(0)
  })

  it('keeps the bird in place when resized mid-round, and moves it for the next round', () => {
    const sim = new FlappySim(800, 7)
    const home = sim.birdX
    sim.flap()
    sim.resize(400)
    expect(sim.birdX).toBe(home)
    sim.reset()
    expect(sim.birdX).toBeLessThan(home)
    sim.resize(800)
    expect(sim.birdX).toBe(home)   // idle: resizes apply at once
  })

  it('holds the waiting screen still with reduced motion', () => {
    const sim = new FlappySim(800, 7)
    sim.calm = true
    const { birdY, camX } = sim
    sim.advance(0.25)
    sim.advance(0.25)
    expect(sim.birdY).toBe(birdY)
    expect(sim.camX).toBe(camX)
    expect(sim.angle).toBe(0)
  })

  it('drops columns once they are off screen', () => {
    const sim = new FlappySim(800, 7)
    sim.flap()
    const ahead = { x: sim.camX + 5000, gapTop: 200, passed: false }
    sim.columns = [
      { x: sim.camX - 1000, gapTop: 200, passed: true },
      { x: sim.camX - 500, gapTop: 200, passed: true },
      ahead,
    ]
    sim.advance(STEP)
    // The two spent ones are gone (a tick may also spawn a new column ahead)
    expect(sim.columns).toContain(ahead)
    for (const c of sim.columns) expect(c.x + COLUMN_W).toBeGreaterThan(sim.camX - 20)
  })

})
