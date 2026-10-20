<template>
  <section
    id="home"
    ref="heroSection"
    class="hero"
  >
    <!-- Sky layers — cross-faded by theme; the flash layer is driven by ambient lightning -->
    <div
      class="sky sky-night"
      aria-hidden="true"
    />
    <div
      class="sky sky-day"
      aria-hidden="true"
    />
    <div
      ref="skyFlash"
      class="sky sky-flash"
      aria-hidden="true"
    />

    <!-- Mount Hood — layered SVG ridgelines, anchored to the bottom of the hero.
         Fills/opacity transition between the dusk storm (dark) and summer sun (light). -->
    <svg
      class="mountain"
      viewBox="0 0 1440 520"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient
          id="hood-glow"
          cx="980"
          cy="240"
          r="520"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(980 240) scale(1 0.4) translate(-980 -240)"
        >
          <stop
            offset="0"
            stop-color="#E3A867"
            stop-opacity="0.34"
          />
          <stop
            offset="0.45"
            stop-color="#E3A867"
            stop-opacity="0.1"
          />
          <stop
            offset="1"
            stop-color="#E3A867"
            stop-opacity="0"
          />
        </radialGradient>
        <radialGradient id="sun-glow">
          <stop
            offset="0"
            stop-color="#FFF1C9"
            stop-opacity="0.9"
          />
          <stop
            offset="0.25"
            stop-color="#FFE3A3"
            stop-opacity="0.45"
          />
          <stop
            offset="1"
            stop-color="#FFE3A3"
            stop-opacity="0"
          />
        </radialGradient>
        <linearGradient
          id="hood-snow-night"
          x1="0"
          y1="66"
          x2="0"
          y2="290"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stop-color="#E9BE8E"
          />
          <stop
            offset="0.45"
            stop-color="#A7AFA8"
          />
          <stop
            offset="1"
            stop-color="#5A6A6C"
          />
        </linearGradient>
        <linearGradient
          id="hood-snow-day"
          x1="0"
          y1="66"
          x2="0"
          y2="240"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stop-color="#FFFFFF"
          />
          <stop
            offset="0.55"
            stop-color="#EEF3F5"
          />
          <stop
            offset="1"
            stop-color="#C3D2DA"
          />
        </linearGradient>
        <linearGradient
          id="hood-shade"
          x1="0"
          y1="66"
          x2="0"
          y2="470"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stop-color="#000"
            stop-opacity="0"
          />
          <stop
            offset="1"
            stop-color="#000"
            stop-opacity="0.45"
          />
        </linearGradient>
      </defs>

      <!-- Dusk alpenglow behind the summit -->
      <rect
        class="alpenglow"
        x="-500"
        y="0"
        width="2440"
        height="520"
        fill="url(#hood-glow)"
      />

      <!-- Summer sun — rises from behind the ridge -->
      <g class="sun">
        <circle
          cx="1215"
          cy="118"
          r="240"
          fill="url(#sun-glow)"
        />
        <circle
          cx="1215"
          cy="118"
          r="32"
          fill="#FFF7E2"
        />
      </g>

      <!-- Distant lightning — sits behind the mountain so Hood occludes the strike -->
      <g
        ref="bolt"
        class="bolt"
      >
        <path
          class="bolt-glow"
          :d="boltPath"
        />
        <path
          class="bolt-core"
          :d="boltPath"
        />
      </g>

      <!-- Distant Cascades, with St. Helens' flat top to the north -->
      <path
        class="m-far"
        d="M-500 392 L-300 380 L-120 388 L40 372 L130 362 L200 342 L238 324 L262 316 L300 317 L326 330 L380 352 L470 360 L560 352 L660 370 L1240 360 L1380 352 L1500 340 L1580 330 L1640 342 L1760 362 L1940 372 V520 H-500 Z"
      />

      <!-- Mount Hood -->
      <path
        class="m-body"
        :d="HOOD_BODY"
      />
      <path
        class="m-shade"
        :d="HOOD_BODY"
        fill="url(#hood-shade)"
      />

      <!-- Winter snowpack (dark) -->
      <g class="night-only">
        <path
          fill="url(#hood-snow-night)"
          d="M872 204 L905 165 L935 120 L958 88 L972 72 L980 66 L990 74 L1004 92 L1030 128 L1062 168 L1082 192 L1070 196 L1060 230 L1046 205 L1030 214 L1018 262 L1004 222 L990 236 L978 290 L966 232 L952 226 L940 270 L930 214 L914 206 L896 236 L892 198 Z"
        />
        <path
          fill="#0B1012"
          fill-opacity="0.3"
          d="M980 66 L990 74 L1004 92 L1030 128 L1062 168 L1082 192 L1070 196 L1060 230 L1046 205 L1030 214 L1018 262 L1004 222 L990 236 L984 150 Z"
        />
      </g>

      <!-- Late-summer snowfields — smaller cap, glaciers retreating into the gullies (light) -->
      <g class="day-only">
        <path
          fill="url(#hood-snow-day)"
          d="M905 165 L935 120 L958 88 L972 72 L980 66 L990 74 L1004 92 L1030 128 L1046 150 L1036 152 L1028 176 L1018 158 L1010 168 L1002 206 L994 172 L986 180 L978 236 L970 178 L960 172 L950 204 L944 166 L932 162 L922 186 L918 158 Z"
        />
        <path
          fill="#3E5A66"
          fill-opacity="0.22"
          d="M980 66 L990 74 L1004 92 L1030 128 L1046 150 L1036 152 L1028 176 L1018 158 L1010 168 L1002 206 L994 172 L986 180 L984 130 Z"
        />
      </g>

      <!-- Foothills + far treeline -->
      <path
        class="m-foot"
        :d="`M-500 450 C-200 436 0 452 160 444 S460 428 620 440 S900 458 1060 446 S1300 432 1440 440 S1740 452 1940 444 V520 H-500 Z ${farTrees}`"
      />

      <!-- Bigfoot, standing in a clearing. Lit by lightning in the dark; hiding in plain sight in the sun. -->
      <g transform="translate(1187 503) scale(0.5) translate(-59 -100)">
        <path
          class="bf"
          :d="BIGFOOT"
        />
        <path
          ref="bigfootLit"
          class="bf-lit"
          :d="BIGFOOT"
        />
      </g>

      <!-- Foreground firs — page colour in the dark so the hero melts into the next section -->
      <path
        class="m-near"
        :d="`M-500 500 H1940 V520 H-500 Z ${nearTrees}`"
      />
    </svg>

    <!-- Canvas weather -->
    <canvas
      ref="cloudCanvas"
      class="canvas-layer"
      style="z-index:2"
      aria-hidden="true"
    />
    <canvas
      ref="rainCanvas"
      class="canvas-layer"
      style="z-index:3"
      aria-hidden="true"
    />

    <div
      class="grain"
      aria-hidden="true"
    />

    <!-- Hero text -->
    <div class="wrap hero-content">
      <div class="max-w-[64rem] flex flex-col items-start">
        <p
          class="status-pill"
          data-aos="fade-up"
        >
          <span class="status-dot" />
          Portland, OR · Open to opportunities
        </p>

        <p
          class="font-mono text-[1.4rem] text-amber mt-8 mb-3"
          data-aos="fade-up"
          data-aos-delay="80"
        >
          Hey there, I'm
        </p>
        <h1
          class="hero-name"
          data-aos="fade-up"
          data-aos-delay="120"
        >
          Josh Ryther
        </h1>
        <p
          class="hero-role"
          data-aos="fade-up"
          data-aos-delay="160"
        >
          Full-Stack Software Engineer
        </p>
        <p
          class="font-mono text-[1.35rem] text-ash mt-3"
          data-aos="fade-up"
          data-aos-delay="160"
        >
          React · Vue · Node.js · TypeScript
        </p>
        <p
          class="hero-summary"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          Building robust, high-quality web applications with a foundation in precision and zero-error-tolerance workflows. Specialized in modernizing legacy systems, architecting scalable solutions, and delivering accessible, user-centric software.
        </p>

        <div
          class="flex flex-wrap items-center gap-4"
          data-aos="fade-up"
          data-aos-delay="240"
        >
          <a
            href="#contact"
            class="button"
          >
            Get in touch
            <svg
              viewBox="0 0 16 16"
              class="w-[1.4rem] h-[1.4rem]"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            ><path
              d="M3 8h10M9 4l4 4-4 4"
              stroke-linecap="round"
              stroke-linejoin="round"
            /></svg>
          </a>
          <a
            :href="resumeUrl"
            target="_blank"
            rel="noreferrer"
            class="button-ghost"
          >View resume</a>

          <div class="flex items-center gap-1 sm:ml-2 max-sm:basis-full max-sm:-ml-3">
            <a
              href="https://linkedin.com/in/joshua-ryther-121400109"
              target="_blank"
              rel="noreferrer"
              class="social-link"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                aria-hidden="true"
              ><!--!Font Awesome Free v7.2.0 by @fontawesome--><path d="M160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 160C544 124.7 515.3 96 480 96L160 96zM165 266.2L231.5 266.2L231.5 480L165 480L165 266.2zM236.7 198.5C236.7 219.8 219.5 237 198.2 237C176.9 237 159.7 219.8 159.7 198.5C159.7 177.2 176.9 160 198.2 160C219.5 160 236.7 177.2 236.7 198.5zM413.9 480L413.9 376C413.9 351.2 413.4 319.3 379.4 319.3C344.8 319.3 339.5 346.3 339.5 374.2L339.5 480L273.1 480L273.1 266.2L336.8 266.2L336.8 295.4L337.7 295.4C346.6 278.6 368.3 260.9 400.6 260.9C467.8 260.9 480.3 305.2 480.3 362.8L480.3 480L413.9 480z" /></svg>
            </a>
            <a
              href="https://github.com/jryther"
              target="_blank"
              rel="noreferrer"
              class="social-link"
              aria-label="GitHub"
              title="GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                aria-hidden="true"
              ><!--!Font Awesome Free v7.2.0--><path d="M544 160C544 124.7 515.3 96 480 96L160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 160zM361.8 471.7C361.8 469.9 361.8 465.7 361.9 460.1C362 448.7 362 431.3 362 416.4C362 400.8 356.8 390.9 350.7 385.7C387.7 381.6 426.7 376.5 426.7 312.6C426.7 294.4 420.2 285.3 409.6 273.6C411.3 269.3 417 251.6 407.9 228.6C394 224.3 362.2 246.5 362.2 246.5C335.6 239 305.6 239 279 246.5C279 246.5 247.2 224.3 233.3 228.6C224.2 251.5 229.8 269.2 231.6 273.6C221 285.3 216 294.4 216 312.6C216 376.2 253.3 381.6 290.3 385.7C285.5 390 281.2 397.4 279.7 408C270.2 412.3 245.9 419.7 231.4 394.1C222.3 378.3 205.9 377 205.9 377C189.7 376.8 204.8 387.2 204.8 387.2C215.6 392.2 223.2 411.4 223.2 411.4C232.9 441.1 279.3 431.1 279.3 431.1C279.3 440.1 279.4 452.8 279.4 461.7C279.4 466.5 279.5 470.3 279.5 471.7C279.5 476 276.5 481.2 268 479.7C202 457.6 155.8 394.8 155.8 321.4C155.8 229.6 226 159.9 317.8 159.9C409.6 159.9 484 229.6 484 321.4C484.1 394.8 439.3 457.7 373.3 479.7C364.9 481.2 361.8 476 361.8 471.7z" /></svg>
            </a>
            <a
              href="mailto:jryther91@gmail.com"
              class="social-link"
              aria-label="Email"
              title="Email"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                aria-hidden="true"
              ><!--!Font Awesome Free v7.2.0--><path d="M112 128C85.5 128 64 149.5 64 176C64 191.1 71.1 205.3 83.2 214.4L291.2 370.4C308.3 383.2 331.7 383.2 348.8 370.4L556.8 214.4C568.9 205.3 576 191.1 576 176C576 149.5 554.5 128 528 128L112 128zM64 260L64 448C64 483.3 92.7 512 128 512L512 512C547.3 512 576 483.3 576 448L576 260L377.6 408.8C343.5 434.4 296.5 434.4 262.4 408.8L64 260z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Coordinates of the summit -->
    <p class="coords wrap">
      45.3736° N, 121.6960° W <span class="opacity-50">·</span> Mt. Hood <span class="opacity-50">·</span> 11,249 ft
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import resumeUrl from '../assets/Resume.pdf'
import { theme } from '../composables/useTheme'
import { scenePaused, heroInView } from '../composables/useScene'
import { gamePlaying } from '../composables/useGame'

interface Puff           { x: number; y: number; r: number }
interface Cloud          { x: number; y: number; speed: number; depth: number; nightCache: HTMLCanvasElement; dayCache: HTMLCanvasElement }
interface Drop           { x: number; y: number; z: number; length: number; speed: number; opacity: number; width: number }
interface Splash         { x: number; y: number; opacity: number; radius: number; maxRadius: number; life: number; decay: number }
interface AnimController { cleanup: () => void; pause: () => void; resume: () => void }
interface CloudController extends AnimController { setDay: (day: boolean) => void }
interface RainController  extends AnimController { setRaining: (raining: boolean) => void }

const rainCanvas  = ref<HTMLCanvasElement | null>(null)
const cloudCanvas = ref<HTMLCanvasElement | null>(null)
const heroSection = ref<HTMLElement | null>(null)
const skyFlash    = ref<HTMLElement | null>(null)
const bolt        = ref<SVGGElement | null>(null)
const bigfootLit  = ref<SVGPathElement | null>(null)
const boltPath    = ref<string>('')

const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// ── Static mountain geometry ─────────────────────────────────────────────────

const HOOD_BODY = 'M-500 470 L200 452 L470 430 L560 392 L640 356 L700 326 L748 296 L778 276 L792 260 L806 264 L822 252 L846 232 L872 204 L905 165 L935 120 L958 88 L972 72 L980 66 L990 74 L1004 92 L1030 128 L1062 168 L1100 214 L1130 240 L1150 262 L1196 292 L1250 320 L1320 350 L1440 384 L1940 430 V520 H-500 Z'

// Hunched, long-armed, mid-stride — drawn in a 120×100 box, feet on y=100
const BIGFOOT = 'M54 2L58 5C64 6 70 10 75 16C80 21 83 28 84 36C86 44 88 54 89 64L90 70L87 72L85 69L82 72L81 66C80 58 78 50 76 44C77 52 77 58 76 64C79 73 83 84 88 92C90 95 89 99 85 99L75 99C73 97 72 94 71 91C68 84 64 77 60 72C57 79 52 87 47 93C46 96 44 99 40 100L29 100C27 98 28 96 31 95C35 94 38 92 40 89C41 81 43 72 45 64C44 59 43 55 43 50C41 55 38 61 36 66L35 71L32 69L30 72L29 66C30 58 32 48 35 40C37 32 39 26 42 21C41 19 40 17 40 15L42 13L41 10C43 7 47 4 50 3Z'

// ── Treelines — generated once with a seeded PRNG so they're identical every render ──

function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// A single Douglas fir: tiers of drooping boughs that widen toward the base
function firPath(x: number, base: number, h: number, w: number): string {
  const tiers = 4
  const top   = base - h
  const right: [number, number][] = []
  for (let t = 1; t <= tiers; t++) {
    const f    = t / tiers
    const y    = top + h * 0.88 * f
    const half = (w / 2) * f
    right.push([half, y])
    if (t < tiers) right.push([half * 0.42, y + h * 0.02])
  }
  right.push([w * 0.035, top + h * 0.88], [w * 0.035, base])
  const r = (n: number) => Math.round(n * 10) / 10
  const rightSide = right.map(([dx, y]) => `L${r(x + dx)} ${r(y)}`).join('')
  const leftSide  = [...right].reverse().map(([dx, y]) => `L${r(x - dx)} ${r(y)}`).join('')
  return `M${r(x)} ${r(top)}${rightSide}${leftSide}Z`
}

function treeline(seed: number, ground: number, minH: number, maxH: number, minStep: number, maxStep: number, clearing?: [number, number]): string {
  const rand  = mulberry32(seed)
  const trees: string[] = []
  for (let x = -500; x < 1940; x += minStep + rand() * (maxStep - minStep)) {
    const h = minH + rand() * (maxH - minH)
    const y = ground + rand() * 6
    const w = h * (0.36 + rand() * 0.1)
    if (clearing && x > clearing[0] && x < clearing[1]) continue
    trees.push(firPath(x, y, h, w))
  }
  return trees.join('')
}

const farTrees  = treeline(7,  452, 14, 32, 12, 24)
const nearTrees = treeline(21, 502, 34, 80, 22, 40, [1160, 1214])

// Jagged strike from above the hero down behind Hood's east shoulder
function makeBolt(): string {
  const x0 = 1170 + Math.random() * 230
  let x = x0
  let y = -320
  let d = `M${x.toFixed(1)} ${y}`
  while (y < 430) {
    y = Math.min(y + 25 + Math.random() * 45, 430)
    x = x0 + (Math.random() - 0.5) * 60
    d += `L${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return d
}

// ── Clouds ────────────────────────────────────────────────────────────────────
// Flat, illustrated clouds to match the vector ridgelines: crisp scalloped silhouettes
// with a lit tone and shade crescents under each bump. Two depth layers drift at
// different speeds. Each cloud is pre-rendered once per palette.

interface CloudPalette { light: string; shade: string; alpha: number }

// Dusk: slate a few shades lighter than the sky. Summer: white with a cool blue underside.
const NIGHT_CLOUDS: CloudPalette = { light: '#2A3841', shade: '#1B252C', alpha: 0.95 }
const DAY_CLOUDS:   CloudPalette = { light: '#FFFFFF', shade: '#D9E8F2', alpha: 0.96 }

// Three kinds of cloud so the sky doesn't look stamped out:
//   cumulus — a tall heap with lumps on the crown
//   stratus — a long, low bank of small bumps
//   puff    — a little three-bump cloud
type CloudKind = 'cumulus' | 'stratus' | 'puff'

const CLOUD_SHAPES: Record<CloudKind, { aspect: number; widthFrac: [number, number]; minW: number; maxW: number }> = {
  cumulus: { aspect: 0.48, widthFrac: [0.18, 0.28], minW: 190, maxW: 480 },
  stratus: { aspect: 0.24, widthFrac: [0.26, 0.4],  minW: 240, maxW: 640 },
  puff:    { aspect: 0.42, widthFrac: [0.09, 0.14], minW: 100, maxW: 220 },
}

function makePuffs(w: number, h: number, kind: CloudKind, rand: () => number): Puff[] {
  const puffs: Puff[] = []
  const baseY = h * 0.78

  // Base row — scalloped bottom, biggest bumps in the middle
  const n = kind === 'puff' ? 3 : Math.max(4, Math.round(w / (h * (kind === 'stratus' ? 0.5 : 0.62))))
  for (let i = 0; i < n; i++) {
    // Puffs huddle close so their three bumps read as one cloud
    const t    = kind === 'puff' ? 0.3 + (i / (n - 1)) * 0.4 : 0.12 + (i / (n - 1)) * 0.76
    const dome = Math.sin(Math.PI * t)
    const r    = kind === 'stratus'
      ? h * (0.24 + dome * 0.12) * (0.85 + rand() * 0.3)
      : h * (0.2 + dome * 0.24) * (0.85 + rand() * 0.3)
    const lift = kind === 'stratus' ? 0.06 : 0.16
    puffs.push({ x: w * t + (rand() - 0.5) * h * 0.1, y: baseY - r * 0.55 - dome * h * lift, r })
  }

  // Crown — lumps on top (tallest for cumulus, a single small one for stratus/puffs)
  const lumps = kind === 'cumulus' ? 2 + Math.floor(rand() * 2) : Math.floor(rand() * 2)
  for (let i = 0; i < lumps; i++) {
    const t = 0.3 + rand() * 0.4
    const r = h * (kind === 'cumulus' ? 0.26 + rand() * 0.1 : 0.2 + rand() * 0.06)
    puffs.push({ x: w * t, y: baseY - Math.sin(Math.PI * t) * h * (kind === 'cumulus' ? 0.52 : 0.34) - r * 0.3, r })
  }
  return puffs
}

// Flat two-tone fill: the whole silhouette in the shade tone, then the same shape nudged
// up-left in the light tone — leaving a crescent of shade under each bump. No base slab,
// so everything outside the bumps stays transparent.
function renderCloud(puffs: Puff[], p: CloudPalette, h: number): HTMLCanvasElement {
  const pad  = 2
  const minX = Math.min(...puffs.map(q => q.x - q.r)), maxX = Math.max(...puffs.map(q => q.x + q.r))
  const minY = Math.min(...puffs.map(q => q.y - q.r)), maxY = Math.max(...puffs.map(q => q.y + q.r))
  const ofc  = document.createElement('canvas')
  ofc.width  = Math.ceil(maxX - minX) + pad * 2
  ofc.height = Math.ceil(maxY - minY) + pad * 2
  const ctx  = ofc.getContext('2d')!
  ctx.translate(pad - minX, pad - minY)

  const shape = (dx = 0, dy = 0) => {
    ctx.beginPath()
    puffs.forEach(({ x, y, r }) => { ctx.moveTo(x + dx + r, y + dy); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2) })
  }

  ctx.fillStyle = p.shade
  shape(); ctx.fill('nonzero')

  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = p.light
  shape(-h * 0.03, -h * 0.1); ctx.fill('nonzero')

  return ofc
}

function pickKind(near: boolean, rand: () => number): CloudKind {
  const roll = rand()
  if (near) return roll < 0.5 ? 'cumulus' : roll < 0.8 ? 'stratus' : 'puff'
  return roll < 0.45 ? 'stratus' : roll < 0.8 ? 'puff' : 'cumulus'
}

function makeCloud(sectionWidth: number, depth: number, index: number, count: number, rand: () => number): Cloud {
  const near  = depth > 0.5
  const kind  = pickKind(near, rand)
  const shape = CLOUD_SHAPES[kind]
  const scale = near ? 1 : 0.7
  const frac  = shape.widthFrac[0] + rand() * (shape.widthFrac[1] - shape.widthFrac[0])
  const w     = Math.min(Math.max(sectionWidth * frac, shape.minW), shape.maxW) * scale
  const h     = w * shape.aspect * (0.9 + rand() * 0.2)
  const puffs = makePuffs(w, h, kind, rand)
  return {
    x: (sectionWidth / count) * index + rand() * (sectionWidth / count) * 0.6,
    y: near ? 90 + rand() * 110 : 40 + rand() * 80,
    speed: near ? 0.09 + rand() * 0.07 : 0.035 + rand() * 0.03,
    depth,
    nightCache: renderCloud(puffs, NIGHT_CLOUDS, h),
    dayCache:   renderCloud(puffs, DAY_CLOUDS, h),
  }
}

function initClouds(canvas: HTMLCanvasElement, startDay: boolean): CloudController {
  const ctx     = canvas.getContext('2d')!
  const section = canvas.parentElement as HTMLElement
  let animationId: number | null = null

  function resize() {
    canvas.width  = section.offsetWidth
    canvas.height = section.offsetHeight
    if (!animationId) render()
  }

  // Far layer first so the near clouds pass in front of it
  const rand   = mulberry32(42)
  const narrow = section.offsetWidth < 768
  const far    = narrow ? 2 : 4
  const near   = narrow ? 2 : 3
  const clouds: Cloud[] = [
    ...Array.from({ length: far },  (_, i) => makeCloud(section.offsetWidth, 0.25 + rand() * 0.15, i, far,  rand)),
    ...Array.from({ length: near }, (_, i) => makeCloud(section.offsetWidth, 0.75 + rand() * 0.25, i, near, rand)),
  ]

  // 0 = storm clouds, 1 = summer cumulus; eased toward the target each frame
  let dayMix    = startDay ? 1 : 0
  let dayTarget = dayMix

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    clouds.forEach(cloud => {
      const depthAlpha = 0.55 + cloud.depth * 0.45
      const left = Math.round(cloud.x - cloud.nightCache.width / 2)
      const top  = Math.round(cloud.y)
      if (dayMix < 1) { ctx.globalAlpha = (1 - dayMix) * NIGHT_CLOUDS.alpha * depthAlpha; ctx.drawImage(cloud.nightCache, left, top) }
      if (dayMix > 0) { ctx.globalAlpha = dayMix       * DAY_CLOUDS.alpha   * depthAlpha; ctx.drawImage(cloud.dayCache,   left, top) }
    })
    ctx.globalAlpha = 1
  }

  function frame() {
    dayMix += Math.sign(dayTarget - dayMix) * Math.min(Math.abs(dayTarget - dayMix), 0.012)
    render()
    clouds.forEach(cloud => {
      cloud.x += cloud.speed
      const half = cloud.nightCache.width / 2
      if (cloud.x - half > canvas.width) cloud.x = -half
    })
    animationId = requestAnimationFrame(frame)
  }

  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(section)
  frame()

  function pause()  { if (animationId !== null) cancelAnimationFrame(animationId); animationId = null }
  function resume() { if (!animationId) frame() }

  // While paused (reduced motion / offscreen / scene paused) jump straight to the new look
  function setDay(day: boolean) {
    dayTarget = day ? 1 : 0
    if (!animationId) { dayMix = dayTarget; render() }
  }

  return { cleanup: () => { resizeObserver.disconnect(); pause() }, pause, resume, setDay }
}

// ── Rain ──────────────────────────────────────────────────────────────────────
// Each drop has a depth (0 = far, 1 = near): nearer drops are longer, thicker,
// brighter and faster, which gives the sheet of rain some volume.

function initRain(canvas: HTMLCanvasElement, startRaining: boolean): RainController {
  const ctx     = canvas.getContext('2d')!
  const section = canvas.parentElement as HTMLElement
  function resize() {
    canvas.width  = section.offsetWidth
    canvas.height = section.offsetHeight
  }
  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(section)

  const ANGLE = Math.PI / 12
  const dx    = Math.sin(ANGLE)
  const dy    = Math.cos(ANGLE)

  const drops: Drop[] = []
  function makeDropAt(x: number, y: number): Drop {
    const z = Math.random()
    return { x, y, z, length: 9 + z * 14, speed: 1.6 + z * 2.2, opacity: 0.12 + z * 0.26, width: 0.5 + z * 0.9 }
  }
  const count = Math.round(Math.min(Math.max(canvas.width / 10, 70), 170))
  for (let i = 0; i < count; i++) drops.push(makeDropAt(Math.random() * canvas.width, Math.random() * canvas.height))

  const splashes: Splash[] = []
  function spawnSplash(x: number, y: number, op: number) {
    splashes.push({ x, y, opacity: Math.min(op * 1.1, 0.35), radius: 1, maxRadius: Math.random() * 8 + 8, life: 1, decay: Math.random() * 0.03 + 0.025 })
  }

  let animationId: number | null = null
  let active      = true                    // false while paused (offscreen / gameplay / scene paused)
  let intensity   = startRaining ? 1 : 0    // eased toward target so the rain tapers off
  let target      = intensity

  function draw() {
    intensity += (target - intensity) * 0.035
    if (target === 0 && intensity < 0.01) intensity = 0

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    drops.forEach(drop => {
      ctx.beginPath()
      ctx.moveTo(drop.x, drop.y)
      ctx.lineTo(drop.x + dx * drop.length, drop.y + dy * drop.length)
      ctx.strokeStyle = `rgba(196,218,248,${drop.opacity * intensity})`
      ctx.lineWidth = drop.width
      ctx.stroke()
      drop.x += dx * drop.speed
      drop.y += dy * drop.speed
      if (drop.y > canvas.height - 8) {
        // Only the nearer drops splash, so the ground line doesn't turn into noise
        if (intensity > 0.15 && drop.z > 0.55) spawnSplash(drop.x, canvas.height - 8, drop.opacity)
        Object.assign(drop, makeDropAt(Math.random() * (canvas.width + 200) - 200, -drop.length - Math.random() * 60))
      }
      if (drop.x > canvas.width + drop.length) { drop.x = -drop.length; drop.y = Math.random() * canvas.height }
    })
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i]; const alpha = s.opacity * s.life
      ctx.beginPath(); ctx.ellipse(s.x, s.y, s.radius * 2.2, s.radius * 0.6, 0, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(196,218,248,${alpha})`; ctx.lineWidth = 1; ctx.stroke()
      s.radius = Math.min(s.radius + 0.5, s.maxRadius); s.life -= s.decay
      if (s.life <= 0) splashes.splice(i, 1)
    }

    // Once the rain has fully stopped, stop the loop too — no point animating nothing
    if (intensity === 0 && splashes.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      animationId = null
      return
    }
    animationId = requestAnimationFrame(draw)
  }

  function start() { if (active && !animationId && (target > 0 || intensity > 0)) draw() }
  start()

  function pause()  { active = false; if (animationId !== null) cancelAnimationFrame(animationId); animationId = null }
  function resume() { active = true; start() }
  function setRaining(raining: boolean) { target = raining ? 1 : 0; start() }

  return { cleanup: () => { resizeObserver.disconnect(); pause() }, pause, resume, setRaining }
}

// ── Ambient lightning (dark mode only) ───────────────────────────────────────
// Photosensitivity (WCAG 2.3.1 / 2.3.2): a "flash" is a pair of opposing changes in
// relative luminance of ≥ 0.1. Each strike here is ONE soft pulse — ~120ms rise, ~1.4s
// fade, no flicker — and the .sky-flash peak is tuned so the sky's relative luminance
// rises by < 0.1 (≈ 0.008 → ≈ 0.05), i.e. below the flash threshold entirely.
// Strikes are ≥ 9s apart, use no saturated red, and never run with prefers-reduced-motion
// or while the scene is paused.

const PULSE = [
  { opacity: 0 },
  { opacity: 1, offset: 0.08, easing: 'cubic-bezier(0.2, 0, 0.2, 1)' },
  { opacity: 0 },
]
const PULSE_TIMING = { duration: 1500, easing: 'ease-out' }

let flashTimer: ReturnType<typeof setTimeout> | null = null
let flashCount = 0

function canFlash() {
  return theme.value === 'dark'
    && heroVisible
    && !scenePaused.value
    && !gamePlaying.value
    && !prefersReducedMotion
    && document.visibilityState === 'visible'
}

function flash() {
  if (!canFlash()) return
  flashCount++

  skyFlash.value?.animate(PULSE, PULSE_TIMING)

  // The bolt is a thin line behind the mountain — a tiny fraction of the screen
  if (Math.random() < 0.6) {
    boltPath.value = makeBolt()
    bolt.value?.animate(PULSE, { ...PULSE_TIMING, duration: 1100 })
  }

  // Bigfoot shows up in roughly one flash in three — and always on the second, so patient visitors catch him
  if (flashCount === 2 || Math.random() < 0.33) {
    bigfootLit.value?.animate(PULSE, { ...PULSE_TIMING, duration: 1900 })
  }
}

function scheduleFlash(minDelay = 9000, maxDelay = 20000) {
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = null
  if (!canFlash()) return
  flashTimer = setTimeout(() => {
    flash()
    scheduleFlash()
  }, minDelay + Math.random() * (maxDelay - minDelay))
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

let rainController: RainController | null = null
let cloudController: CloudController | null = null
let heroIntersectionObserver: IntersectionObserver | null = null
let heroVisible = true

function pauseHeroAnims()  { rainController?.pause();  cloudController?.pause()  }
function resumeHeroAnims() {
  // Reduced motion: clouds stay as a still frame and the rain never starts
  if (prefersReducedMotion || scenePaused.value) return
  rainController?.resume(); cloudController?.resume()
}

function syncHeroAnims() {
  if (heroVisible && !gamePlaying.value) resumeHeroAnims()
  else pauseHeroAnims()
  scheduleFlash(3000, 9000)
}

function onVisibilityChange() { scheduleFlash(3000, 9000) }

onMounted(() => {
  const isDay = theme.value === 'light'
  cloudController = initClouds(cloudCanvas.value!, isDay)
  if (prefersReducedMotion) cloudController.pause()
  else rainController = initRain(rainCanvas.value!, !isDay)
  if (scenePaused.value) pauseHeroAnims()

  // ── Pause animations when Hero scrolls out of view ──────────────────────
  heroIntersectionObserver = new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting
    heroInView.value = heroVisible
    syncHeroAnims()
  }, { threshold: 0.05 })
  heroIntersectionObserver.observe(heroSection.value!)

  // ── Visitor-controlled pause (header control) ──
  // ── Give the mini-game the frame budget while a round is in play ──
  watch(gamePlaying, syncHeroAnims)

  watch(scenePaused, (paused) => {
    if (paused) { pauseHeroAnims(); scheduleFlash() }
    else syncHeroAnims()
  })

  // ── Weather follows the theme: storm at dusk, clear skies in summer ──
  watch(theme, (next) => {
    const day = next === 'light'
    cloudController?.setDay(day)
    rainController?.setRaining(!day)
    scheduleFlash(4000, 9000)
  })

  document.addEventListener('visibilitychange', onVisibilityChange)
  scheduleFlash(4000, 7000)
})

onUnmounted(() => {
  rainController?.cleanup()
  cloudController?.cleanup()
  heroIntersectionObserver?.disconnect()
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (flashTimer) clearTimeout(flashTimer)
})
</script>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  align-items: center;
  overflow: hidden;
  background-color: var(--color-charcoal);
}

/* ── Sky ── */
.sky {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.sky-night {
  background:
    radial-gradient(ellipse 55% 40% at 68% 64%, rgb(227 168 103 / 0.09), transparent 70%),
    linear-gradient(180deg, #0B1012 0%, #0F181B 45%, #15211F 100%);
}

.sky-day {
  background:
    radial-gradient(ellipse 45% 45% at 80% 32%, rgb(255 238 196 / 0.6), transparent 70%),
    linear-gradient(180deg, #A9D1EE 0%, #C4E0F2 45%, #E4EFF0 72%, #F6EBD0 100%);
  opacity: 0;
  transition: opacity 1.8s ease;
}

/* Peak tuned for photosensitivity: over the dusk sky (L ≈ 0.008) the brightest point reaches
   L ≈ 0.05 — a change well under the 0.1 that WCAG 2.3.1 counts as a flash. Keep it that way. */
.sky-flash {
  background: radial-gradient(ellipse 75% 65% at 82% 38%, rgb(150 165 200 / 0.3), rgb(150 165 200 / 0.08) 60%, transparent 85%);
  opacity: 0;
}

/* ── Mountain ── */
/* Sized by height so the peak keeps its proportions; overflow shows the extended ridgelines */
.mountain {
  position: absolute;
  bottom: 0;
  left: 50%;
  z-index: 1;
  height: 62%;
  aspect-ratio: 1440 / 520;
  transform: translateX(-50%);
  overflow: visible;
  pointer-events: none;
}

.alpenglow, .sun, .night-only, .day-only,
.m-far, .m-body, .m-shade, .m-foot, .m-near, .bf {
  transition: fill 1.8s ease, opacity 1.8s ease, transform 2.4s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.m-far   { fill: #1B282B; }
.m-body  { fill: #2A393B; }
.m-foot  { fill: #111A1B; }
.m-near  { fill: #0B1012; }
.bf      { fill: #0B1012; }
.bf-lit  { fill: #B4C2D8; opacity: 0; }
.day-only { opacity: 0; }
.sun     { opacity: 0; transform: translateY(300px); }

.bolt { opacity: 0; }
.bolt-glow { fill: none; stroke: rgb(190 210 255 / 0.25); stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }
.bolt-core { fill: none; stroke: rgb(232 240 255 / 0.9); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }

/* Summer sun */
:root[data-theme="light"] .sky-day    { opacity: 1; }
:root[data-theme="light"] .alpenglow  { opacity: 0; }
:root[data-theme="light"] .night-only { opacity: 0; }
:root[data-theme="light"] .day-only   { opacity: 1; }
:root[data-theme="light"] .sun        { opacity: 1; transform: none; }
:root[data-theme="light"] .m-far      { fill: #AFC7CC; }
:root[data-theme="light"] .m-body     { fill: #7D96A0; }
:root[data-theme="light"] .m-shade    { opacity: 0.55; }
:root[data-theme="light"] .m-foot     { fill: #5E8B69; }
:root[data-theme="light"] .m-near     { fill: #2E5A43; }
:root[data-theme="light"] .bf         { fill: #284F3B; }

.canvas-layer {
  position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;
}

/* Film grain — keeps the gradients from banding and adds a little texture */
.grain {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  opacity: 0.06;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
:root[data-theme="light"] .grain { opacity: 0.04; }

.hero-content {
  position: relative;
  z-index: 5;
  padding-top: 10rem;
  padding-bottom: 18vh;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.6rem 1.2rem;
  border: 1px solid var(--color-line-strong);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-surface) 60%, transparent);
  backdrop-filter: blur(6px);
  font-family: var(--font-mono);
  font-size: 1.2rem;
  color: var(--color-mist);
}

.status-dot {
  position: relative;
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: var(--color-moss);
}
.status-dot::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--color-moss);
  animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes ping {
  75%, 100% { transform: scale(2.4); opacity: 0; }
}

.hero-name {
  font-size: clamp(5.2rem, 9vw, 10.4rem);
  font-weight: 700;
  letter-spacing: -0.045em;
  line-height: 0.95;
  color: var(--color-snow);
}

.hero-role {
  margin-top: 1.8rem;
  font-size: clamp(2rem, 2.6vw, 2.8rem);
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--color-snow);
  opacity: 0.88;
}

.hero-summary {
  max-width: 56rem;
  margin: 2.4rem 0 3.2rem;
  font-size: clamp(1.5rem, 1.4vw, 1.7rem);
  line-height: 1.7;
  color: var(--color-mist);
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 0.8rem;
  color: var(--color-mist);
  transition: color 0.2s ease, background-color 0.2s ease;
}
.social-link:hover {
  color: var(--color-amber);
  background-color: color-mix(in srgb, var(--color-snow) 6%, transparent);
}
.social-link svg {
  width: 2rem;
  height: 2rem;
  fill: currentColor;
}

/* Sits over the foreground firs, which stay dark green in the sun — so it stays light in both themes */
.coords {
  position: absolute;
  left: 50%;
  bottom: 2.4rem;
  z-index: 5;
  transform: translateX(-50%);
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 1.15rem;
  letter-spacing: 0.04em;
  color: #9FB0AA;
  pointer-events: none;
}
:root[data-theme="light"] .coords { color: #E2ECE5; }

@media (max-width: 768px) {
  .hero { align-items: flex-start; }
  .hero-content { padding-top: 11rem; padding-bottom: 0; }
  /* Centre the summit on narrow screens instead of the whole range */
  .mountain { height: 32%; transform: translateX(-68%); }
  .coords { font-size: 1.05rem; bottom: 1.6rem; }
}
</style>
