// Game simulation for the chat's mini-game, kept free of DOM and canvas code.
//
// Everything is in world units: the world is always WORLD_H tall, and its width follows the
// canvas aspect ratio. Physics advance in fixed STEP-sized ticks no matter how often the
// browser draws, so the game plays the same at 30, 60, or 144 fps and at any screen size.
// The renderer interpolates between the last two ticks for smooth motion.

export const WORLD_H   = 600
export const GROUND_H  = 64
export const STEP      = 1 / 120   // seconds per physics tick

export const BIRD_R    = 17
export const COLUMN_W  = 70
export const GAP_H     = 210        // opening between the top and bottom column
const SPACING          = 290        // distance between columns
const GRAVITY          = 1100       // units / s²
const FLAP_VY          = -340       // units / s
const MAX_FALL         = 720
const BASE_SPEED       = 160        // units / s
const SPEED_PER_POINT  = 4
const MAX_SPEED        = 280
const IDLE_SPEED       = 40         // background keeps drifting before the first flap
const EDGE_MARGIN      = 70         // keep openings away from the ceiling and ground
const MAX_GAP_SHIFT    = 200        // limit how far the opening jumps between columns
const DYING_SECONDS    = 0.7
const HIT_INSET        = 4          // forgiving collisions

export type Phase = 'idle' | 'playing' | 'dying' | 'dead'

export interface Column {
  x: number        // world x of the column's left edge
  gapTop: number   // world y where the opening starts
  passed: boolean
}

export interface TickEvents {
  scored: number
  died: boolean
}

export function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class FlappySim {
  phase: Phase = 'idle'
  worldW: number
  score = 0
  columns: Column[] = []

  birdX = 0
  birdY = 0
  vy = 0
  angle = 0
  /** Distance the camera has travelled; columns live in this coordinate space */
  camX = 0

  // Values at the start of the latest tick, for render interpolation
  prevBirdY = 0
  prevAngle = 0
  prevCamX = 0

  /** Seconds since the last flap; drives the wing animation */
  sinceFlap = 1
  time = 0
  /** Reduced motion: the waiting screen holds still (no bob, no idle scroll) */
  calm = false

  private rand: () => number
  private acc = 0
  private nextColumnX = 0
  private dyingFor = 0

  constructor(worldW: number, seed = Date.now()) {
    this.worldW = worldW
    this.rand = mulberry32(seed)
    this.reset()
  }

  resize(worldW: number) {
    this.worldW = worldW
    // Mid-round the bird keeps its place, so a resize can't move it into a column; the new
    // position applies from the next round
    if (this.phase === 'idle') this.birdX = this.homeX()
  }

  private homeX(): number {
    return Math.min(this.worldW * 0.28, 230)
  }

  reset() {
    this.birdX = this.homeX()
    this.phase = 'idle'
    this.score = 0
    this.columns = []
    this.vy = 0
    this.angle = 0
    this.birdY = this.idleY()
    this.prevBirdY = this.birdY
    this.prevAngle = 0
    this.prevCamX = this.camX
    this.sinceFlap = 1
    this.acc = 0
    this.dyingFor = 0
  }

  get speed(): number {
    return Math.min(MAX_SPEED, BASE_SPEED + this.score * SPEED_PER_POINT)
  }

  /** How far the latest frame sits between the last two ticks (0–1) */
  get alpha(): number {
    return this.acc / STEP
  }

  /** Returns false when a flap isn't possible (dying or dead) */
  flap(): boolean {
    if (this.phase === 'dying' || this.phase === 'dead') return false
    if (this.phase === 'idle') {
      this.phase = 'playing'
      // First column sits a fixed distance ahead (or just off screen on wide canvases)
      this.nextColumnX = this.camX + Math.max(this.worldW + 10, this.birdX + 520)
    }
    this.vy = FLAP_VY
    this.sinceFlap = 0
    return true
  }

  /** Advance by real elapsed time; runs as many fixed ticks as fit */
  advance(dt: number): TickEvents {
    const events: TickEvents = { scored: 0, died: false }
    this.acc += Math.min(dt, 0.25)   // a long stall (tab switch) doesn't fast-forward the game
    while (this.acc >= STEP) {
      this.acc -= STEP
      this.tick(events)
    }
    return events
  }

  private idleY(): number {
    return (WORLD_H - GROUND_H) * 0.45
  }

  private tick(events: TickEvents) {
    this.prevBirdY = this.birdY
    this.prevAngle = this.angle
    this.prevCamX = this.camX
    this.time += STEP
    this.sinceFlap += STEP

    if (this.phase === 'idle') {
      if (this.calm) {
        this.birdY = this.idleY()
        this.angle = 0
        return
      }
      this.camX += IDLE_SPEED * STEP
      this.birdY = this.idleY() + Math.sin(this.time * 2.6) * 10
      this.angle = Math.sin(this.time * 2.6) * 0.1
      return
    }

    if (this.phase === 'dead') return

    // Gravity applies while playing and while falling after a crash
    this.vy = Math.min(this.vy + GRAVITY * STEP, MAX_FALL)
    this.birdY += this.vy * STEP
    const floor = WORLD_H - GROUND_H - BIRD_R

    if (this.phase === 'dying') {
      this.angle = Math.min(Math.PI / 2, this.angle + 4.2 * STEP)
      if (this.birdY >= floor) { this.birdY = floor; this.vy = 0 }
      this.dyingFor += STEP
      if (this.dyingFor >= DYING_SECONDS) this.phase = 'dead'
      return
    }

    // Nose up on a flap, then tip down as the bird falls
    this.angle = this.vy < 0
      ? Math.max(-0.45, this.vy * 0.0013)
      : Math.min(Math.PI / 2, this.angle + 2.4 * STEP)

    this.camX += this.speed * STEP

    while (this.nextColumnX < this.camX + this.worldW + COLUMN_W) {
      this.spawnColumn(this.nextColumnX)
      this.nextColumnX += SPACING
    }

    const birdWorldX = this.camX + this.birdX
    for (const c of this.columns) {
      if (!c.passed && c.x + COLUMN_W < birdWorldX - BIRD_R) {
        c.passed = true
        this.score++
        events.scored++
      }
    }
    // Columns spawn in order, so spent ones are always at the front (dropped in place, rather
    // than a new array every tick)
    while (this.columns.length && this.columns[0].x + COLUMN_W <= this.camX - 20) this.columns.shift()

    if (this.birdY - BIRD_R <= 0 || this.birdY >= floor || this.hitsColumn(birdWorldX)) {
      this.birdY = Math.min(Math.max(this.birdY, BIRD_R), floor)
      this.phase = 'dying'
      this.dyingFor = 0
      this.vy = Math.max(this.vy, 0)
      events.died = true
    }
  }

  private spawnColumn(x: number) {
    const min = EDGE_MARGIN
    const max = WORLD_H - GROUND_H - GAP_H - EDGE_MARGIN
    const last = this.columns[this.columns.length - 1]
    let gapTop = min + this.rand() * (max - min)
    if (last) gapTop = Math.min(Math.max(gapTop, last.gapTop - MAX_GAP_SHIFT), last.gapTop + MAX_GAP_SHIFT)
    this.columns.push({ x, gapTop, passed: false })
  }

  private hitsColumn(birdWorldX: number): boolean {
    const r = BIRD_R - HIT_INSET
    for (const c of this.columns) {
      if (birdWorldX + r < c.x || birdWorldX - r > c.x + COLUMN_W) continue
      if (this.birdY - r < c.gapTop || this.birdY + r > c.gapTop + GAP_H) return true
    }
    return false
  }
}
