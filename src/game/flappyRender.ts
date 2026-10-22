import { WORLD_H, GROUND_H, BIRD_R, COLUMN_W, GAP_H, mulberry32, type FlappySim, type Phase } from './flappySim'
import type { Theme } from '../composables/useTheme'

// Draws the mini-game in the site's flat Pacific Northwest style: cut-tree stumps and logs,
// parallax mountains, fir treelines and two-tone clouds. Dusk in dark mode, summer day in light.
//
// Background layers are painted once into offscreen canvases (rebuilt only on resize or a
// theme change), so each frame is a handful of image copies plus the trees and bird.
// The canvas is drawn at device-pixel resolution (capped at 2×) so it stays sharp.

interface Palette {
  sky: [string, string]
  stars: string | null
  sun: string | null
  cloudLight: string
  cloudShade: string
  mountainFar: string
  mountainMid: string
  snow: string
  treesFar: string
  treesNear: string
  ground: string
  groundTop: string
  groundDetail: string
  bark: string
  barkShade: string
  barkLight: string
  barkGroove: string
  wood: string
  woodRing: string
  moss: string
  mossDark: string
  bird: string
  birdWing: string
  birdBelly: string
  beak: string
  eye: string
  scoreText: string
  scoreShadow: string
}

// Colours follow the hero scene's night and day palettes
const PALETTES: Record<Theme, Palette> = {
  dark: {
    sky: ['#0C1416', '#1A2C2E'],
    stars: 'rgba(232, 238, 234, 0.75)',
    sun: null,
    cloudLight: '#2A3841',
    cloudShade: '#1B252C',
    mountainFar: '#1B282B',
    mountainMid: '#22302F',
    snow: '#9AA8AC',
    treesFar: '#16211F',
    treesNear: '#0F1716',
    ground: '#0B1012',
    groundTop: '#1F3D33',
    groundDetail: '#163027',
    bark: '#3B3029',
    barkShade: '#2C241F',
    barkLight: '#4A3D33',
    barkGroove: 'rgba(11, 16, 18, 0.45)',
    wood: '#8A6C4C',
    woodRing: '#6B5038',
    moss: '#5E8C6A',
    mossDark: '#3F6A4E',
    bird: '#E3A867',
    birdWing: '#C98A4B',
    birdBelly: '#F3D7B0',
    beak: '#D99A5B',
    eye: '#0B1012',
    scoreText: '#E8EEEA',
    scoreShadow: 'rgba(0, 0, 0, 0.45)',
  },
  light: {
    sky: ['#A9CFE0', '#EAF2EC'],
    stars: null,
    sun: '#FFE3A3',
    cloudLight: '#FFFFFF',
    cloudShade: '#D9E8F2',
    mountainFar: '#AFC7CC',
    mountainMid: '#7D96A0',
    snow: '#FFFFFF',
    treesFar: '#5E8B69',
    treesNear: '#3F6E50',
    ground: '#2E5A43',
    groundTop: '#4E8C60',
    groundDetail: '#3F7A52',
    bark: '#6B4F3A',
    barkShade: '#584030',
    barkLight: '#80624B',
    barkGroove: 'rgba(30, 20, 12, 0.3)',
    wood: '#E2C08F',
    woodRing: '#C29A68',
    moss: '#4E8C60',
    mossDark: '#3F7A52',
    bird: '#E39A4C',
    birdWing: '#B8722F',
    birdBelly: '#F8E0BC',
    beak: '#C46A1E',
    eye: '#13201C',
    scoreText: '#13201C',
    scoreShadow: 'rgba(255, 255, 255, 0.55)',
  },
}

interface Layer {
  canvas: HTMLCanvasElement
  /** World y of the canvas's top edge; each layer only covers the band it draws in */
  y: number
  /** How fast the layer scrolls relative to the columns (1 = same speed) */
  factor: number
  /** Extra drift in world units per second (clouds) */
  drift: number
}

const PLAY_H = WORLD_H - GROUND_H

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  // Rounded, not ceiled: tile widths are whole pixels already, give or take float error
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.ceil(h))
  return c
}

export class FlappyRenderer {
  private ctx: CanvasRenderingContext2D
  private palette: Palette = PALETTES.dark
  private k = 1            // device pixels per world unit
  private worldW = 0
  private sky: HTMLCanvasElement | null = null
  private layers: Layer[] = []

  constructor(private canvas: HTMLCanvasElement) {
    // null when the browser is out of canvas memory or has 2D canvas turned off
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D is not available')
    this.ctx = ctx
  }

  /** Size in CSS pixels; returns the world width for the simulation */
  resize(cssW: number, cssH: number): number {
    // Low-memory devices (mostly phones) get 1.5×: still sharp, far less canvas memory
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
    const dpr = Math.min(window.devicePixelRatio || 1, memory <= 4 ? 1.5 : 2)
    this.canvas.width = Math.max(1, Math.round(cssW * dpr))
    this.canvas.height = Math.max(1, Math.round(cssH * dpr))
    this.k = this.canvas.height / WORLD_H
    this.worldW = this.canvas.width / this.k
    this.buildLayers()
    return this.worldW
  }

  setTheme(theme: Theme) {
    this.palette = PALETTES[theme]
    if (this.worldW) this.buildLayers()
  }

  // ── Cached background ─────────────────────────────────────────────────────

  private buildLayers() {
    const k = this.k
    const p = this.palette
    // Tiles are wider than the view so repeats are hard to spot, and seamless at the edges.
    // A whole number of pixels wide, so each repeat starts exactly where the last one ends
    const tileWU = Math.ceil(Math.max(this.worldW, 900) * 1.25 * k) / k

    this.sky = this.buildSky()
    this.layers = [
      { ...this.buildClouds(tileWU, k), factor: 0.12, drift: 6 },
      { ...this.buildRidge(tileWU, k, p.mountainFar, PLAY_H * 0.42, 70, [2, 3, 5], 11, true), factor: 0.18, drift: 0 },
      { ...this.buildRidge(tileWU, k, p.mountainMid, PLAY_H * 0.62, 40, [3, 5, 8], 23, false), factor: 0.3, drift: 0 },
      { ...this.buildTrees(tileWU, k, p.treesFar, PLAY_H - 6, 46, 18, 31), factor: 0.5, drift: 0 },
      { ...this.buildTrees(tileWU, k, p.treesNear, PLAY_H + 4, 64, 34, 47), factor: 0.75, drift: 0 },
      { ...this.buildGround(tileWU, k), factor: 1, drift: 0 },
    ]
  }

  /** A tile canvas covering world y top..bottom, with the context shifted so drawing uses world y */
  private band(tileWU: number, k: number, top: number, bottom: number) {
    const canvas = makeCanvas(tileWU * k, (bottom - top) * k)
    const g = canvas.getContext('2d')!
    g.translate(0, -top * k)
    return { canvas, g, y: top }
  }

  private buildSky(): HTMLCanvasElement {
    const p = this.palette
    const c = makeCanvas(this.canvas.width, this.canvas.height)
    const g = c.getContext('2d')!
    const grad = g.createLinearGradient(0, 0, 0, c.height)
    grad.addColorStop(0, p.sky[0])
    grad.addColorStop(0.85, p.sky[1])
    g.fillStyle = grad
    g.fillRect(0, 0, c.width, c.height)

    const k = this.k
    if (p.stars) {
      const rand = mulberry32(5)
      g.fillStyle = p.stars
      const count = Math.round((this.worldW / 900) * 46)
      for (let i = 0; i < count; i++) {
        const r = (0.6 + rand() * 1.1) * k
        g.globalAlpha = 0.35 + rand() * 0.65
        g.beginPath()
        g.arc(rand() * c.width, rand() * PLAY_H * 0.55 * k, r, 0, Math.PI * 2)
        g.fill()
      }
      g.globalAlpha = 1
    }
    if (p.sun) {
      const cx = c.width * 0.78, cy = PLAY_H * 0.2 * k, r = 34 * k
      const glow = g.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 3.2)
      glow.addColorStop(0, 'rgba(255, 227, 163, 0.55)')
      glow.addColorStop(1, 'rgba(255, 227, 163, 0)')
      g.fillStyle = glow
      g.fillRect(cx - r * 3.2, cy - r * 3.2, r * 6.4, r * 6.4)
      g.fillStyle = p.sun
      g.beginPath()
      g.arc(cx, cy, r, 0, Math.PI * 2)
      g.fill()
    }
    return c
  }

  /** A seamless ridgeline: sine waves with whole-number cycles per tile */
  private buildRidge(tileWU: number, k: number, color: string, base: number, amp: number, freqs: number[], seed: number, snow: boolean) {
    const rand = mulberry32(seed)
    const waves = freqs.map(f => ({ f, a: amp * (0.4 + rand() * 0.6) / Math.sqrt(f / freqs[0]), ph: rand() * Math.PI * 2 }))
    const yAt = (x: number) => base - waves.reduce((s, w) => s + w.a * Math.sin((x / tileWU) * Math.PI * 2 * w.f + w.ph), 0)

    // Points about every 6 units, spaced so the last lands exactly on the tile's edge (a
    // shortfall there cut a sliver out of the mountain at every repeat)
    const steps = Math.ceil(tileWU / 6)
    const xs = Array.from({ length: steps + 1 }, (_, i) => (tileWU * i) / steps)

    const peak = base - waves.reduce((s, w) => s + w.a, 0) - 2
    const { canvas: c, g, y } = this.band(tileWU, k, Math.max(0, peak), PLAY_H)
    const path = new Path2D()
    path.moveTo(0, PLAY_H * k)
    for (const x of xs) path.lineTo(x * k, yAt(x) * k)
    path.lineTo(tileWU * k, PLAY_H * k)
    path.closePath()
    g.fillStyle = color
    g.fill(path)

    if (snow) {
      // Snow on whatever sticks up above the snow line, with a ragged lower edge. Its waves
      // also repeat a whole number of times per tile, so the edge lines up at the seam
      const snowLine = base - amp * 0.55
      const cycles = (perUnit: number) => (Math.PI * 2 * Math.max(1, Math.round((tileWU * perUnit) / (Math.PI * 2)))) / tileWU
      const fine = cycles(0.21), coarse = cycles(0.067)
      g.save()
      g.clip(path)
      g.fillStyle = this.palette.snow
      g.beginPath()
      g.moveTo(0, 0)
      for (const x of xs) {
        const ragged = snowLine + Math.sin(x * fine) * 5 + Math.sin(x * coarse + 1) * 6
        g.lineTo(x * k, ragged * k)
      }
      g.lineTo(tileWU * k, 0)
      g.closePath()
      g.fill()
      g.restore()
    }
    return { canvas: c, y }
  }

  private buildTrees(tileWU: number, k: number, color: string, baseY: number, maxH: number, spacing: number, seed: number) {
    const rand = mulberry32(seed)
    const bottom = PLAY_H + 10   // the ground covers everything below
    const { canvas: c, g, y } = this.band(tileWU, k, baseY - maxH - 2, bottom)
    g.fillStyle = color
    // Solid band under the trees so gaps between trunks don't show sky
    g.fillRect(0, (baseY - 8) * k, c.width, (bottom - baseY + 8) * k)
    for (let x = 0; x < tileWU; x += spacing * (0.6 + rand() * 0.8)) {
      const h = maxH * (0.55 + rand() * 0.45)
      const w = h * (0.38 + rand() * 0.1)
      // Draw at x and its wrapped copy so trees crossing the tile edge stay seamless
      for (const ox of [x, x - tileWU, x + tileWU]) this.fir(g, ox * k, baseY * k, w * k, h * k)
    }
    return { canvas: c, y }
  }

  /** Stacked-tier fir, same flat silhouette as the hero */
  private fir(g: CanvasRenderingContext2D, x: number, base: number, w: number, h: number) {
    g.beginPath()
    const tiers = 3
    for (let i = 0; i < tiers; i++) {
      const top = base - h + (h * i) / (tiers + 0.6)
      const bottom = base - (h * (tiers - 1 - i)) / (tiers + 1.6)
      const half = (w / 2) * (0.55 + (0.45 * (i + 1)) / tiers)
      g.moveTo(x, top)
      g.lineTo(x + half, bottom)
      g.lineTo(x - half, bottom)
      g.closePath()
    }
    g.fill()
  }

  private buildClouds(tileWU: number, k: number) {
    const p = this.palette
    const rand = mulberry32(17)
    const { canvas: c, g, y } = this.band(tileWU, k, 0, 50 + PLAY_H * 0.35 + 70)
    const count = Math.round(tileWU / 260)
    for (let i = 0; i < count; i++) {
      const cx = (i + rand() * 0.6) * (tileWU / count)
      const cy = 50 + rand() * PLAY_H * 0.35
      const w = 70 + rand() * 90
      const h = w * (0.32 + rand() * 0.12)
      const puffs = Array.from({ length: 4 }, (_, j) => {
        const t = (j + 0.5) / 4
        return { x: (t - 0.5) * w * 0.8, y: -Math.sin(t * Math.PI) * h * 0.45 + (rand() - 0.5) * h * 0.15, r: h * (0.42 + Math.sin(t * Math.PI) * 0.28) }
      })
      for (const ox of [cx, cx - tileWU, cx + tileWU]) {
        // Shade first, then the lit shape nudged up-left: the hero's flat two-tone look
        g.fillStyle = p.cloudShade
        for (const pf of puffs) { g.beginPath(); g.arc((ox + pf.x) * k, (cy + pf.y) * k, pf.r * k, 0, Math.PI * 2); g.fill() }
        g.fillStyle = p.cloudLight
        for (const pf of puffs) { g.beginPath(); g.arc((ox + pf.x - h * 0.04) * k, (cy + pf.y - h * 0.1) * k, pf.r * 0.92 * k, 0, Math.PI * 2); g.fill() }
      }
    }
    return { canvas: c, y }
  }

  private buildGround(tileWU: number, k: number) {
    const p = this.palette
    const rand = mulberry32(29)
    const { canvas: c, g, y } = this.band(tileWU, k, PLAY_H, WORLD_H)
    g.fillStyle = p.ground
    g.fillRect(0, PLAY_H * k, c.width, GROUND_H * k)
    g.fillStyle = p.groundTop
    g.fillRect(0, PLAY_H * k, c.width, 7 * k)
    // Ferns and stones along the forest floor
    g.fillStyle = p.groundDetail
    for (let x = 0; x < tileWU; x += 14 + rand() * 30) {
      const w = 6 + rand() * 12
      const dy = PLAY_H + 14 + rand() * (GROUND_H - 24)
      for (const ox of [x, x - tileWU]) {
        g.beginPath()
        g.ellipse((ox + w / 2) * k, dy * k, (w / 2) * k, 2.4 * k, 0, 0, Math.PI * 2)
        g.fill()
      }
    }
    return { canvas: c, y }
  }

  // ── Per frame ─────────────────────────────────────────────────────────────

  render(sim: FlappySim) {
    const g = this.ctx
    const k = this.k
    const p = this.palette
    const a = sim.alpha
    const cam = sim.prevCamX + (sim.camX - sim.prevCamX) * a

    if (this.sky) g.drawImage(this.sky, 0, 0)

    // Clouds drift on their own, except with reduced motion
    const driftTime = sim.calm ? 0 : sim.time

    // Parallax layers (ground last, it sits in front of the trees)
    for (let i = 0; i < this.layers.length - 1; i++) this.drawLayer(this.layers[i], cam, driftTime)

    for (const c of sim.columns) this.drawTrees(g, (c.x - cam) * k, c.gapTop, k, p)

    this.drawLayer(this.layers[this.layers.length - 1], cam, driftTime)

    const y = sim.prevBirdY + (sim.birdY - sim.prevBirdY) * a
    const ang = sim.prevAngle + (sim.angle - sim.prevAngle) * a
    this.drawBird(g, sim.birdX * k, y * k, ang, sim.sinceFlap, k, p, sim.phase)

    if (sim.phase === 'playing' || sim.phase === 'dying') {
      const size = Math.round(54 * k)
      g.save()
      g.font = `600 ${size}px Inter, system-ui, sans-serif`
      g.textAlign = 'center'
      g.textBaseline = 'top'
      g.fillStyle = p.scoreShadow
      g.fillText(String(sim.score), this.canvas.width / 2 + 2 * k, 30 * k + 3 * k)
      g.fillStyle = p.scoreText
      g.fillText(String(sim.score), this.canvas.width / 2, 30 * k)
      g.restore()
    }
  }

  private drawLayer(layer: Layer, cam: number, time: number) {
    const w = layer.canvas.width
    let off = ((cam * layer.factor + time * layer.drift) * this.k) % w
    if (off < 0) off += w
    const x = -Math.round(off)
    const y = Math.round(layer.y * this.k)
    this.ctx.drawImage(layer.canvas, x, y)
    if (x + w < this.canvas.width) this.ctx.drawImage(layer.canvas, x + w, y)
  }

  /**
   * One obstacle: a sawn log hanging from above and a stump rising from the ground, each
   * showing its cut face (rings) at the opening. Same footprint as the collision box.
   */
  private drawTrees(g: CanvasRenderingContext2D, x: number, gapTop: number, k: number, p: Palette) {
    const w = COLUMN_W * k
    const cx = x + w / 2
    const ry = 9 * k                       // cut face seen slightly from the side
    const top = gapTop * k                 // bottom of the hanging log
    const bottom = (gapTop + GAP_H) * k    // top of the stump
    const floor = PLAY_H * k
    // Stable per-tree variation (gapTop never changes for a given obstacle)
    const vary = (n: number) => ((Math.floor(gapTop) * 9301 + n * 49297) % 233280) / 233280

    const trunk = (y0: number, y1: number) => {
      g.fillStyle = p.bark
      g.fillRect(x, y0, w, y1 - y0)
      g.fillStyle = p.barkShade
      g.fillRect(x + w * 0.7, y0, w * 0.3, y1 - y0)
      g.fillStyle = p.barkLight
      g.fillRect(x, y0, w * 0.1, y1 - y0)
      // Bark grooves
      g.fillStyle = p.barkGroove
      const line = Math.max(1, 1.4 * k)
      for (const fx of [0.28, 0.5, 0.78]) g.fillRect(x + w * (fx + (vary(fx * 10) - 0.5) * 0.06), y0, line, y1 - y0)
    }

    const cutFace = (cy: number) => {
      g.fillStyle = p.barkShade
      g.beginPath(); g.ellipse(cx, cy, w / 2, ry, 0, 0, Math.PI * 2); g.fill()
      g.fillStyle = p.wood
      g.beginPath(); g.ellipse(cx, cy, w / 2 - 4 * k, ry - 2 * k, 0, 0, Math.PI * 2); g.fill()
      g.strokeStyle = p.woodRing
      g.lineWidth = Math.max(1, 1.2 * k)
      for (const f of [0.68, 0.4]) {
        g.beginPath(); g.ellipse(cx, cy, (w / 2 - 4 * k) * f, (ry - 2 * k) * f, 0, 0, Math.PI * 2); g.stroke()
      }
      g.fillStyle = p.woodRing
      g.beginPath(); g.ellipse(cx, cy, 2.2 * k, 1.1 * k, 0, 0, Math.PI * 2); g.fill()
    }

    // ── Hanging log: trunk down to its sawn end, with a branch stub ──
    trunk(0, top - ry)
    const stubY = Math.min(top - ry - 30 * k, (40 + vary(1) * 120) * k)
    if (stubY > 10 * k) {
      const left = vary(2) < 0.5
      g.fillStyle = p.bark
      g.beginPath()
      if (left) { g.moveTo(x + 2 * k, stubY); g.lineTo(x - 14 * k, stubY - 9 * k); g.lineTo(x - 14 * k, stubY - 2 * k); g.lineTo(x + 2 * k, stubY + 8 * k) }
      else { g.moveTo(x + w - 2 * k, stubY); g.lineTo(x + w + 14 * k, stubY - 9 * k); g.lineTo(x + w + 14 * k, stubY - 2 * k); g.lineTo(x + w - 2 * k, stubY + 8 * k) }
      g.closePath()
      g.fill()
    }
    cutFace(top - ry)

    // ── Stump: flared roots at the ground, moss on the bark, cut top with rings ──
    trunk(bottom + ry, floor)
    g.fillStyle = p.bark
    g.beginPath()
    g.moveTo(x, floor - 22 * k)
    g.quadraticCurveTo(x - 2 * k, floor - 4 * k, x - 12 * k, floor)
    g.lineTo(x + w + 12 * k, floor)
    g.quadraticCurveTo(x + w + 2 * k, floor - 4 * k, x + w, floor - 22 * k)
    g.closePath()
    g.fill()
    g.fillStyle = p.barkShade
    g.beginPath()
    g.moveTo(x + w * 0.7, floor - 22 * k)
    g.lineTo(x + w, floor - 22 * k)
    g.quadraticCurveTo(x + w + 2 * k, floor - 4 * k, x + w + 12 * k, floor)
    g.lineTo(x + w * 0.7, floor)
    g.closePath()
    g.fill()
    // A patch of moss on the shady lower trunk
    const mossY = floor - (34 + vary(3) * 40) * k
    if (mossY > bottom + ry + 12 * k) {
      g.fillStyle = p.moss
      g.beginPath(); g.ellipse(x + w * 0.8, mossY, 9 * k, 6 * k, 0, 0, Math.PI * 2); g.fill()
      g.fillStyle = p.mossDark
      g.beginPath(); g.ellipse(x + w * 0.86, mossY + 4 * k, 6 * k, 4 * k, 0, 0, Math.PI * 2); g.fill()
    }
    cutFace(bottom + ry)
  }

  private drawBird(g: CanvasRenderingContext2D, x: number, y: number, ang: number, sinceFlap: number, k: number, p: Palette, phase: Phase) {
    const r = BIRD_R * k
    // Wing flaps hard right after a tap, then settles into a slow glide beat
    const flapPhase = phase === 'dying' || phase === 'dead' ? 0.2 : Math.max(0, 1 - sinceFlap * 4)
    const wingLift = phase === 'idle' ? Math.sin(sinceFlap * 9) * 0.35 : flapPhase * 0.9 - 0.1

    g.save()
    g.translate(x, y)
    g.rotate(ang)

    // Tail
    g.fillStyle = p.birdWing
    g.beginPath()
    g.moveTo(-r * 0.75, -r * 0.1)
    g.lineTo(-r * 1.35, -r * 0.45)
    g.lineTo(-r * 1.25, r * 0.25)
    g.closePath()
    g.fill()

    // Body
    g.fillStyle = p.bird
    g.beginPath()
    g.ellipse(0, 0, r, r * 0.88, 0, 0, Math.PI * 2)
    g.fill()

    // Belly
    g.fillStyle = p.birdBelly
    g.beginPath()
    g.ellipse(r * 0.12, r * 0.32, r * 0.58, r * 0.42, 0, 0, Math.PI * 2)
    g.fill()

    // Wing
    g.save()
    g.translate(-r * 0.15, r * 0.05)
    g.rotate(-wingLift)
    g.fillStyle = p.birdWing
    g.beginPath()
    g.ellipse(-r * 0.15, 0, r * 0.55, r * 0.26, -0.15, 0, Math.PI * 2)
    g.fill()
    g.restore()

    // Eye
    g.fillStyle = p.eye
    g.beginPath()
    g.arc(r * 0.45, -r * 0.22, r * 0.13, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(255, 255, 255, 0.9)'
    g.beginPath()
    g.arc(r * 0.49, -r * 0.27, r * 0.045, 0, Math.PI * 2)
    g.fill()

    // Beak
    g.fillStyle = p.beak
    g.beginPath()
    g.moveTo(r * 0.78, -r * 0.12)
    g.lineTo(r * 1.28, r * 0.04)
    g.lineTo(r * 0.78, r * 0.2)
    g.closePath()
    g.fill()

    g.restore()
  }
}
