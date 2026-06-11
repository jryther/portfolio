<template>
  <div
    ref="containerEl"
    class="flex flex-col overflow-hidden"
  >
    <!-- ── Top bar: swaps to shader warning when compiling ── -->
    <div
      class="flex items-center gap-4 px-3 py-2 border-b flex-shrink-0 transition-colors duration-300"
      :class="isCompilingShaders
        ? 'bg-amber/[.12] border-amber/30'
        : 'bg-white/[.03] border-white/[.06]'"
    >
      <!-- Shader compilation warning state -->
      <template v-if="isCompilingShaders">
        <span class="text-[1.4rem] leading-none flex-shrink-0">🖥️</span>
        <span class="flex-1 text-base font-semibold text-amber leading-snug min-w-0">
          Compiling GPU shaders — browser may freeze briefly
        </span>
      </template>

      <!-- Normal loading state -->
      <template v-else-if="!modelReady">
        <div class="flex-1 flex flex-col gap-[4px] min-w-0">
          <div class="flex items-center justify-between gap-2">
            <span class="text-base text-[#777] truncate">{{ loadingText }}</span>
            <span class="text-base font-semibold text-amber flex-shrink-0">{{ Math.round(loadingProgress) }}%</span>
          </div>
          <div class="h-[4px] w-full bg-white/[.08] rounded-full overflow-hidden">
            <div
              class="h-full bg-amber rounded-full transition-[width] duration-300 ease-out"
              :style="{ width: loadingProgress + '%' }"
            />
          </div>
        </div>
      </template>

      <!-- Model ready state -->
      <template v-else>
        <div class="flex-1 text-base font-semibold text-amber">
          ✅ AI model ready — exit the game to chat
        </div>
      </template>

      <!-- Icon buttons — always visible -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <button
          class="text-[1.6rem] leading-none bg-transparent border-none cursor-pointer px-1 py-[2px] rounded transition-colors hover:bg-white/[.06]"
          :title="muted ? 'Unmute sounds' : 'Mute sounds'"
          @click.stop="toggleMute"
        >
          {{ muted ? '🔇' : '🔊' }}
        </button>
        <button
          class="text-[1.6rem] leading-none bg-transparent border-none cursor-pointer px-1 py-[2px] rounded transition-colors text-[#777] hover:text-snow hover:bg-white/[.06]"
          :title="props.expanded ? 'Collapse' : 'Expand'"
          @click.stop="emit('toggle-expand')"
        >
          {{ props.expanded ? '🔽' : '🔳' }}
        </button>
      </div>
    </div>

    <!-- ── Score row ── -->
    <div class="flex justify-between items-center px-3 py-[0.35rem] text-base text-[#777] flex-shrink-0 border-b border-white/[.04]">
      <span>Score <span class="text-amber font-bold ml-1">{{ score }}</span></span>
      <span>Best <span class="text-amber font-bold ml-1">{{ highScore }}</span></span>
    </div>

    <!-- ── Canvas area ── -->
    <div
      ref="canvasWrapperEl"
      class="relative flex-1 overflow-hidden select-none cursor-pointer"
      @click="handleFlap"
      @touchstart.prevent="handleFlap"
    >
      <canvas
        ref="canvasEl"
        class="block w-full h-full"
      />

      <!-- Shader compilation pause overlay -->
      <Transition name="fade-game">
        <div
          v-if="isCompilingShaders || shaderPausedMidGame"
          class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-[3px]"
          :class="shaderPausedMidGame ? 'cursor-pointer' : 'pointer-events-none'"
          @click.stop="shaderPausedMidGame && resumeAfterShaderPause()"
          @touchstart.prevent="shaderPausedMidGame && resumeAfterShaderPause()"
        >
          <span class="text-4xl leading-none">{{ shaderPausedMidGame ? '▶️' : '🖥️' }}</span>
          <p class="text-lg font-bold text-amber m-0">
            {{ shaderPausedMidGame ? 'Shaders Ready' : 'Game Paused' }}
          </p>
          <p class="text-base text-[#bbb] m-0 text-center px-6 leading-snug">
            <template v-if="shaderPausedMidGame">
              Tap or press Space to resume
            </template>
            <template v-else>
              Compiling GPU shaders<br>Browser may freeze briefly — this is normal
            </template>
          </p>
        </div>
      </Transition>

      <!-- Idle hint — hidden while shaders are compiling -->
      <div
        v-if="gamePhase === 'idle' && !isCompilingShaders"
        class="absolute inset-0 flex flex-col items-center justify-end pb-[30%] gap-2 pointer-events-none"
      >
        <span class="text-base text-[#999] bg-black/50 rounded-full px-4 py-[0.3rem]">
          Tap / Space to start
        </span>
      </div>

      <!-- Game over overlay — hidden when model-ready overlay takes over -->
      <Transition name="fade-game">
        <div
          v-if="gamePhase === 'dead' && deathAnimDone && !showModelReadyOverlay"
          class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/65 backdrop-blur-[2px]"
        >
          <span class="text-4xl leading-none">💀</span>
          <p class="text-lg font-bold text-snow m-0">
            Game Over
          </p>
          <p class="text-base text-[#aaa] m-0">
            Score <span class="text-amber font-semibold">{{ score }}</span>
          </p>
          <button
            class="button py-[0.45rem] px-5 text-base"
            @click.stop="restart"
          >
            Play Again
          </button>
        </div>
      </Transition>

      <!-- Model ready overlay — only appears after death, not mid-game -->
      <Transition name="fade-game">
        <div
          v-if="showModelReadyOverlay"
          class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75 backdrop-blur-[3px]"
        >
          <span class="text-4xl leading-none">🎉</span>
          <p class="text-xl font-bold text-snow m-0">
            AI Model Ready!
          </p>
          <p class="text-base text-[#aaa] m-0">
            Score <span class="text-amber font-semibold">{{ score }}</span>
          </p>
          <div class="flex flex-col gap-2 items-center w-full px-8">
            <button
              class="button py-[0.45rem] px-5 text-base w-full justify-center text-center"
              @click.stop="emit('continue-to-chat')"
            >
              Continue to Chat
            </button>
            <button
              class="text-[#888] text-base hover:text-snow transition-colors py-1 bg-transparent border-none cursor-pointer font-[inherit]"
              @click.stop="restart(); dismissReadyOverlay()"
            >
              Play Again
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { aiThinking, gamePlaying, shaderCompiling } from '../../composables/useAiState'

// ── Props / Emits ──────────────────────────────────────────────────────────────
const props = defineProps<{
  loadingProgress: number
  loadingText: string
  modelReady: boolean
  expanded: boolean
}>()

const emit = defineEmits<{
  close: []
  'continue-to-chat': []
  'toggle-expand': []
}>()

// ── DOM refs ───────────────────────────────────────────────────────────────────
const containerEl    = ref<HTMLDivElement | null>(null)
const canvasWrapperEl = ref<HTMLDivElement | null>(null)
const canvasEl       = ref<HTMLCanvasElement | null>(null)

// ── Reactive UI state ──────────────────────────────────────────────────────────
const score          = ref(0)
const highScore      = ref(parseInt(localStorage.getItem('flappyHighScore') ?? '0', 10))
const muted          = ref(true)
const gamePhase      = ref<'idle' | 'playing' | 'dead'>('idle')
const deathAnimDone  = ref(false)
const overlayDismissed = ref(false)

// Keep gamePlaying in sync so Hero.vue only pauses during active play
watch(gamePhase, (phase) => { gamePlaying.value = phase === 'playing' })

// True after shader compilation finishes while the game was mid-play — user must tap to resume
const shaderPausedMidGame = ref(false)

function resumeAfterShaderPause() {
  shaderPausedMidGame.value = false
  running = true
  rafId = requestAnimationFrame(loop)
}

const showModelReadyOverlay = computed(
  () => props.modelReady && !overlayDismissed.value && gamePhase.value === 'dead' && deathAnimDone.value
)

// Show freeze warning when WebLLM is loading GPU shader modules
const isCompilingShaders = computed(() => shaderCompiling.value)

// ── Audio ──────────────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null

const sfxFlap  = () => pianoSfx([[784.00, 0.032, 0]])
const sfxScore = () => pianoSfx([[523.25, 0.048, 0], [783.99, 0.052, 0.11]])
const sfxDeath = () => pianoSfx([[523.25, 0.042, 0], [392.00, 0.038, 0.13], [261.63, 0.034, 0.28]])

// Shared piano-style tone helper for SFX — matches background music timbre
function pianoSfx(notes: [freq: number, vol: number, delayS: number][]) {
  if (muted.value) return
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    for (const [freq, vol, delayS] of notes) {
      const t = audioCtx.currentTime + delayS
      // Fundamental with two-stage decay
      const o1 = audioCtx.createOscillator(), g1 = audioCtx.createGain()
      o1.type = 'sine'; o1.frequency.value = freq
      g1.gain.setValueAtTime(0.001, t)
      g1.gain.linearRampToValueAtTime(vol,       t + 0.003)
      g1.gain.exponentialRampToValueAtTime(vol * 0.28, t + 0.06)
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
      o1.connect(g1); g1.connect(audioCtx.destination)
      o1.start(t); o1.stop(t + 0.6)
      // 2nd harmonic — warm attack, gone quickly
      const o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain()
      o2.type = 'sine'; o2.frequency.value = freq * 2
      g2.gain.setValueAtTime(0.001, t)
      g2.gain.linearRampToValueAtTime(vol * 0.38, t + 0.002)
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
      o2.connect(g2); g2.connect(audioCtx.destination)
      o2.start(t); o2.stop(t + 0.2)
    }
  } catch { /* audio not available */ }
}


// ── Music (procedural nighttime synth via Web Audio API) ─────────────────────
// C major pentatonic arpeggio + warm low bass foundation
const ARP_NOTES    = [523.25, 659.25, 784.00, 880.00, 1046.50, 880.00, 784.00, 659.25]
const ARP_INTERVAL = 0.32

let musicCtx:    AudioContext | null = null
let musicMaster: GainNode    | null = null
let musicDelay:  DelayNode   | null = null
let musicOscs:   OscillatorNode[]   = []
let musicScheduler: ReturnType<typeof setInterval> | null = null
let nextNoteTime = 0
let arpStep      = 0

function ensureMusic() {
  try {
    if (!musicCtx) {
      musicCtx    = new AudioContext()
      musicMaster = musicCtx.createGain()
      musicMaster.gain.value = muted.value ? 0 : 0.34
      musicMaster.connect(musicCtx.destination)

      // ── Echo/delay — short feedback for shimmer, not density ──
      musicDelay = musicCtx.createDelay(1.5)
      musicDelay.delayTime.value = 0.30
      const fb  = musicCtx.createGain(); fb.gain.value = 0.22
      const wet = musicCtx.createGain(); wet.gain.value = 0.18
      musicDelay.connect(fb); fb.connect(musicDelay)
      musicDelay.connect(wet); wet.connect(musicMaster)

      // ── Bass layer: C2 root + G2 fifth, both sine, slow-breathing LFO ──
      // LFO keeps gain between 0.025–0.055 so it's always audible but gentle
      const bassLfo  = musicCtx.createOscillator()
      const bassLfoG = musicCtx.createGain()
      bassLfo.type = 'sine'; bassLfo.frequency.value = 0.08   // ~12 s breath cycle
      bassLfoG.gain.value = 0.015
      bassLfo.connect(bassLfoG)
      bassLfo.start(); musicOscs.push(bassLfo)

      for (const [freq, centerGain] of [[65.41, 0.042], [98.00, 0.018]] as [number, number][]) {
        const osc = musicCtx.createOscillator()
        const g   = musicCtx.createGain()
        osc.type = 'sine'; osc.frequency.value = freq
        g.gain.value = centerGain
        bassLfoG.connect(g.gain)   // same LFO modulates both
        osc.connect(g); g.connect(musicMaster)
        osc.start(); musicOscs.push(osc)
      }

      // ── Arpeggio scheduler ──
      nextNoteTime = musicCtx.currentTime + 0.05
      arpStep = 0
      scheduleArpBatch()
      musicScheduler = setInterval(scheduleArpBatch, 100)


    } else if (musicCtx.state === 'suspended') {
      musicCtx.resume().catch(() => {})
    }
  } catch { /* audio blocked */ }
}

function scheduleArpBatch() {
  if (!musicCtx || !musicMaster || !musicDelay) return
  const ahead = 0.25
  while (nextNoteTime < musicCtx.currentTime + ahead) {
    const freq = ARP_NOTES[arpStep % ARP_NOTES.length]
    const t    = nextNoteTime
    const dur  = ARP_INTERVAL * 0.65   // short notes = more sparkly/crisp
    const osc  = musicCtx.createOscillator()
    const g    = musicCtx.createGain()
    osc.type = 'sine'; osc.frequency.value = freq
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.048, t + 0.018)   // fast attack = bell-like
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(g)
    g.connect(musicMaster)
    g.connect(musicDelay)   // send through echo for shimmer
    osc.start(t); osc.stop(t + dur + 0.05)
    nextNoteTime += ARP_INTERVAL
    arpStep++
  }
}

function stopMusic() {
  if (musicScheduler !== null) { clearInterval(musicScheduler); musicScheduler = null }
  musicOscs.forEach(o => { try { o.stop() } catch { /* oscillator already stopped */ } })
  musicOscs = []
  musicCtx?.close().catch(() => {})
  musicCtx = null; musicMaster = null; musicDelay = null
}

function setMusicVolume(vol: number) {
  if (musicMaster && musicCtx) {
    musicMaster.gain.setTargetAtTime(vol, musicCtx.currentTime, 0.15)
  }
}

// ── Game internal state (non-reactive) ────────────────────────────────────────
let W = 0, H = 0, GH = 0   // canvas width, height, ground height

// Bird
let bx = 0, by = 0, bvy = 0, br = 0, bAng = 0, wingTimer = 0, idleT = 0

// Pipes
interface Pipe { x: number; topH: number; passed: boolean }
let pipes: Pipe[] = []
let pipeTimer = 0

// Particles / background
interface Star { x: number; y: number; r: number; s: number }
let stars: Star[] = []

// Timing
let deathTimer = 0
let rafId = 0, running = false

// ── Game constants ─────────────────────────────────────────────────────────────
// Reference canvas size: the expanded view on a typical desktop monitor.
// All game values are stored as ratios of these reference dimensions and then
// re-scaled every time the canvas is resized so the game looks and plays
// identically regardless of which modal size is active.
const H_REF = 620   // reference canvas height  (approx. expanded view)
const W_REF = 1200  // reference canvas width   (approx. expanded view)

const DEATH_ANIM_FRAMES = 42   // frame count – not pixel-based, stays fixed

// Scaled game values – recomputed in initDimensions()
let GRAVITY_S        = 0.07
let FLAP_VY_S        = -3.0
let VY_MAX_S         = 13
let VY_DEATH_MAX_S   = 14
let PIPE_GAP_S       = 252
let PIPE_WIDTH_S     = 52
let GROUND_H_S       = 42
let BIRD_R_S         = 19
let PIPE_DIST_S      = 320
let IDLE_FLOAT_S     = 11
let H_SCALE          = 1.0   // H / H_REF  – used to normalise physics
let W_SCALE          = 1.0   // W / W_REF  – used to normalise horizontal speed

const PIPE_INT  = () => Math.round(PIPE_DIST_S / pSpd())

const pGap = () => PIPE_GAP_S
const pW   = () => PIPE_WIDTH_S
const pSpd = () => (1.0 + score.value * 0.03) * W_SCALE

// ── Init ───────────────────────────────────────────────────────────────────────
function initDimensions() {
  const c = canvasEl.value!
  W = c.width; H = c.height

  H_SCALE = H / H_REF
  W_SCALE = W / W_REF

  // All pixel-based values scale with canvas height; horizontal
  // distance / speed scales with canvas width so timing stays consistent.
  GRAVITY_S       = 0.07  * H_SCALE
  FLAP_VY_S       = -3.0  * H_SCALE
  VY_MAX_S        = 13    * H_SCALE
  VY_DEATH_MAX_S  = 14    * H_SCALE
  PIPE_GAP_S      = 252   * H_SCALE
  PIPE_WIDTH_S    = 52    * H_SCALE   // scale by height so gap–to–pipe ratio stays constant
  GROUND_H_S      = 42    * H_SCALE
  BIRD_R_S        = 19    * H_SCALE
  PIPE_DIST_S     = 320   * W_SCALE
  IDLE_FLOAT_S    = 11    * H_SCALE

  GH = GROUND_H_S
  bx = W * 0.22
  br = BIRD_R_S
}

function buildStars() {
  stars = Array.from({ length: 28 }, () => ({
    x: Math.random() * W,
    y: Math.random() * (H - GH) * 0.7,
    r: Math.random() * 1.3 + 0.4,
    s: Math.random() * 0.4 + 0.1,
  }))
}

function resetGame() {
  by = H * 0.42; bvy = 0; bAng = 0; wingTimer = 0; idleT = 0
  pipeTimer = 0; deathTimer = 0
  pipes = []
  score.value = 0
  deathAnimDone.value = false
  gamePhase.value = 'idle'
}

// ── Input ──────────────────────────────────────────────────────────────────────
function handleFlap() {
  ensureMusic()
  if (showModelReadyOverlay.value) return
  if (shaderPausedMidGame.value) { resumeAfterShaderPause(); return }
  if (gamePhase.value === 'dead') return
  if (gamePhase.value === 'idle') {
    gamePhase.value = 'playing'
    spawnPipe()       // first pipe appears immediately
    pipeTimer = 0     // next pipe follows at normal interval
  }
  bvy = FLAP_VY_S; bAng = -0.4; wingTimer = 10
  sfxFlap()
}

function dismissReadyOverlay() {
  overlayDismissed.value = true
}

function restart() {
  resetGame()
}


function toggleMute() {
  muted.value = !muted.value
  setMusicVolume(muted.value ? 0 : 0.34)
}

// ── Update ─────────────────────────────────────────────────────────────────────
function spawnPipe() {
  const gap = pGap(), minT = H * 0.12, maxT = H - GH - gap - H * 0.12
  const topH = minT + Math.random() * (maxT - minT)
  pipes.push({ x: W + 4, topH, passed: false })
}

function update() {
  if (gamePhase.value === 'playing') {
    for (const s of stars) {
      s.x -= s.s
      if (s.x < 0) { s.x = W; s.y = Math.random() * (H - GH) * 0.7 }
    }
  }

  if (gamePhase.value === 'idle') {
    idleT++
    by  = H * 0.42 + Math.sin(idleT * 0.05) * IDLE_FLOAT_S
    bAng = Math.sin(idleT * 0.05) * 0.12
    return
  }

  if (gamePhase.value === 'dead') {
    deathTimer++
    bvy = Math.min(bvy + GRAVITY_S, VY_DEATH_MAX_S); by += bvy
    bAng = Math.min(Math.PI / 2, bAng + 0.07)
    if (deathTimer >= DEATH_ANIM_FRAMES && !deathAnimDone.value) deathAnimDone.value = true
    return
  }

  // ── playing ──
  wingTimer = Math.max(0, wingTimer - 1)
  bvy = Math.min(bvy + GRAVITY_S, VY_MAX_S); by += bvy
  // Normalise bvy by H_SCALE so the tilt angle is the same regardless of canvas size
  bAng = bvy < 0 ? Math.max(-0.45, (bvy / H_SCALE) * 0.05) : Math.min(Math.PI / 2, bAng + 0.04)

  pipeTimer++
  if (pipeTimer >= PIPE_INT()) { spawnPipe(); pipeTimer = 0 }

  const spd = pSpd(), gap = pGap(), pw = pW()
  for (const p of pipes) {
    p.x -= spd
    if (!p.passed && p.x + pw < bx) {
      p.passed = true
      score.value++
      if (score.value > highScore.value) {
        highScore.value = score.value
        localStorage.setItem('flappyHighScore', String(highScore.value))
      }
      sfxScore()
    }
  }
  pipes = pipes.filter(p => p.x > -pw - 4)

  // Ceiling
  if (by - br <= 0) { by = br; killBird(); return }
  // Ground
  if (by + br >= H - GH) { by = H - GH - br; killBird(); return }
  // Pipes
  for (const p of pipes) {
    if (bx + br > p.x + 5 && bx - br < p.x + pw - 5) {
      if (by - br < p.topH || by + br > p.topH + gap) { killBird(); return }
    }
  }
}

function killBird() {
  sfxDeath()
  gamePhase.value = 'dead'
  deathTimer = 0
}

// ── Draw ───────────────────────────────────────────────────────────────────────
function draw() {
  const c = canvasEl.value; if (!c) return
  const ctx = c.getContext('2d')!

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, H - GH)
  sky.addColorStop(0, '#0b1520')
  sky.addColorStop(1, '#162a40')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H - GH)

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  for (const s of stars) {
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill()
  }

  // Pipes
  const gap = pGap(), pw = pW()
  for (const p of pipes) drawPipe(ctx, p.x, p.topH, pw, gap)

  // Ground
  ctx.fillStyle = '#1c3d12'; ctx.fillRect(0, H - GH, W, GH)
  ctx.fillStyle = '#2d6a1a'; ctx.fillRect(0, H - GH, W, 6)

  // Bird
  drawBird(ctx, bx, by, br, bAng, wingTimer > 0)

  // In-canvas score while playing
  if (gamePhase.value === 'playing') {
    const fs = Math.max(20, W * 0.085)
    ctx.save()
    ctx.font = `bold ${fs}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 8
    ctx.fillText(String(score.value), W / 2, fs + 10)
    ctx.restore()
  }
}

function drawPipe(ctx: CanvasRenderingContext2D, x: number, topH: number, pw: number, gap: number) {
  const cH = Math.max(10, H * 0.038), cx = 5
  // Top pipe
  ctx.fillStyle = '#1b4332'; ctx.fillRect(x + pw - 4, 0, 4, topH)
  ctx.fillStyle = '#2d6a4f'; ctx.fillRect(x, 0, pw - 4, topH)
  ctx.fillStyle = '#1b4332'; ctx.fillRect(x + pw - cx - 4, topH - cH, cx + 4, cH)
  ctx.fillStyle = '#40916c'; ctx.fillRect(x - cx, topH - cH, pw + cx * 2, cH)
  // Bottom pipe
  const botY = topH + gap
  ctx.fillStyle = '#1b4332'; ctx.fillRect(x + pw - 4, botY + cH, 4, H - botY - cH)
  ctx.fillStyle = '#2d6a4f'; ctx.fillRect(x, botY + cH, pw - 4, H - botY - cH)
  ctx.fillStyle = '#40916c'; ctx.fillRect(x - cx, botY, pw + cx * 2, cH)
}

function drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ang: number, flap: boolean) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang)
  // Shadow
  ctx.beginPath(); ctx.ellipse(2, 3, r, r * 0.65, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill()
  // Wing
  ctx.save(); ctx.rotate(flap ? 0.55 : 0.18)
  ctx.beginPath(); ctx.ellipse(-r * 0.1, r * 0.22, r * 0.52, r * 0.21, -0.25, 0, Math.PI * 2)
  ctx.fillStyle = '#c07010'; ctx.fill(); ctx.restore()
  // Body
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fillStyle = '#F5A623'; ctx.fill()
  ctx.strokeStyle = '#c07010'; ctx.lineWidth = 1.5; ctx.stroke()
  // Belly
  ctx.beginPath(); ctx.arc(r * 0.1, r * 0.28, r * 0.48, 0, Math.PI * 2)
  ctx.fillStyle = '#ffd070'; ctx.fill()
  // Eye white
  ctx.beginPath(); ctx.arc(r * 0.37, -r * 0.14, r * 0.28, 0, Math.PI * 2)
  ctx.fillStyle = 'white'; ctx.fill()
  // Pupil
  ctx.beginPath(); ctx.arc(r * 0.44, -r * 0.11, r * 0.14, 0, Math.PI * 2)
  ctx.fillStyle = '#111'; ctx.fill()
  // Glint
  ctx.beginPath(); ctx.arc(r * 0.5, -r * 0.18, r * 0.06, 0, Math.PI * 2)
  ctx.fillStyle = 'white'; ctx.fill()
  // Beak
  ctx.beginPath()
  ctx.moveTo(r * 0.52, -r * 0.05); ctx.lineTo(r * 1.1, r * 0.14); ctx.lineTo(r * 0.52, r * 0.3)
  ctx.closePath(); ctx.fillStyle = '#FF8C00'; ctx.fill()
  ctx.restore()
}

// ── Game loop ──────────────────────────────────────────────────────────────────
function loop() {
  if (!running) return
  update(); draw()
  rafId = requestAnimationFrame(loop)
}

// Draw-only loop — keeps the canvas painted without advancing game state
function drawOnlyLoop() {
  if (!running) return
  draw()
  rafId = requestAnimationFrame(drawOnlyLoop)
}

// ── Canvas resize ──────────────────────────────────────────────────────────────
function resizeCanvas() {
  const c = canvasEl.value; const wrapper = canvasWrapperEl.value
  if (!c || !wrapper) return
  const { width, height } = wrapper.getBoundingClientRect()
  if (!width || !height) return
  c.width  = Math.floor(width)
  c.height = Math.floor(height)
  initDimensions()
  buildStars()
}

// ── Keyboard ───────────────────────────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault()
    handleFlap()
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────
let ro: ResizeObserver

onMounted(() => {
  resizeCanvas()
  resetGame()

  running = true
  rafId = requestAnimationFrame(loop)

  window.addEventListener('keydown', onKeyDown)

  ro = new ResizeObserver(resizeCanvas)
  ro.observe(canvasWrapperEl.value!)

  // Pause the game loop while the AI is generating to free up GPU time
  watch(aiThinking, (thinking) => {
    if (thinking) {
      running = false
      cancelAnimationFrame(rafId)
    } else if (gamePhase.value !== 'idle' && !shaderCompiling.value) {
      running = true
      rafId = requestAnimationFrame(loop)
    }
  })

  // Pause the game loop during shader compilation
  watch(shaderCompiling, (compiling) => {
    if (compiling) {
      running = false
      cancelAnimationFrame(rafId)
    } else if (!aiThinking.value) {
      if (gamePhase.value === 'playing') {
        // Stay paused — user must tap to resume so they don't die unexpectedly
        shaderPausedMidGame.value = true
        // Keep draw-only loop running so the scene stays visible
        running = true
        rafId = requestAnimationFrame(drawOnlyLoop)
      } else {
        // Idle or dead — safe to resume normally
        running = true
        rafId = requestAnimationFrame(loop)
      }
    }
  })
})

onUnmounted(() => {
  running = false
  cancelAnimationFrame(rafId)
  window.removeEventListener('keydown', onKeyDown)
  ro?.disconnect()
  audioCtx?.close().catch(() => {})
  stopMusic()
  gamePlaying.value = false
})
</script>

<style scoped>
.fade-game-enter-active,
.fade-game-leave-active {
  transition: opacity 0.2s ease, transform 0.22s ease;
}
.fade-game-enter-from,
.fade-game-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.shader-warn-enter-active,
.shader-warn-leave-active {
  transition: opacity 0.25s ease, max-height 0.3s ease;
  max-height: 3rem;
  overflow: hidden;
}
.shader-warn-enter-from,
.shader-warn-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>

