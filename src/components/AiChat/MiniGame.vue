<template>
  <div class="mini-game">
    <!-- Top bar: score, AI status, controls -->
    <div class="game-bar">
      <div class="game-stats">
        <span
          class="best"
          :title="t('game.bestTitle')"
        >
          <UiIcon
            name="trophy"
            class="trophy-icon"
          />
          {{ t('game.best') }} <span class="best-value">{{ highScore }}</span>
        </span>
      </div>

      <div class="game-ai">
        <div
          v-if="modelStatus === 'loading'"
          class="ai-progress"
          :title="loadingText"
        >
          <span class="ai-progress-label">{{ t('game.aiProgress', { progress: loadingProgress }) }}</span>
          <div class="progress-track">
            <div
              class="progress-bar"
              :style="{ width: loadingProgress + '%' }"
            />
          </div>
        </div>
        <span
          v-else-if="modelReady && wasLoading"
          class="ai-ready"
        >{{ t('game.aiReady') }}</span>
      </div>

      <button
        class="icon-btn"
        :aria-label="muted ? t('game.soundOn') : t('game.soundOff')"
        :title="muted ? t('game.soundOn') : t('game.soundOff')"
        @click="toggleMute"
      >
        <UiIcon :name="muted ? 'sound-off' : 'sound-on'" />
      </button>
    </div>

    <!-- Screen reader announcement of each round's result -->
    <p
      class="sr-only"
      aria-live="polite"
    >
      {{ phase === 'dead' ? `${t('game.overAnnouncement', { score })} ${newBest ? t('game.newBest') : t('game.bestScore', { score: highScore })}` : '' }}
    </p>

    <!-- Play area -->
    <div
      ref="stageEl"
      class="stage"
      tabindex="0"
      role="application"
      :aria-label="t('game.stage')"
      @pointerdown="onPress"
      @keydown="onKeyDown"
    >
      <canvas
        ref="canvasEl"
        class="game-canvas"
      />

      <!-- Start hint -->
      <Transition name="fade-game">
        <div
          v-if="phase === 'idle'"
          class="start-hint"
        >
          <span class="hint">
            <UiIcon
              name="play"
              class="hint-icon"
            />
            {{ t('game.hint') }}
          </span>
        </div>
      </Transition>

      <!-- Game over -->
      <Transition name="fade-game">
        <div
          v-if="phase === 'dead'"
          class="game-over"
          @pointerdown.stop
        >
          <div class="over-card">
            <p class="eyebrow-mini">
              {{ t('game.over') }}
            </p>
            <p class="final-score">
              {{ score }}
            </p>
            <p
              class="best-line"
              :class="{ 'is-new': newBest }"
            >
              {{ newBest ? t('game.newBest') : t('game.bestScore', { score: highScore }) }}
            </p>
            <div class="over-actions">
              <button
                ref="againEl"
                class="button again-btn"
                @click="restart"
              >
                <UiIcon
                  name="refresh"
                  class="again-icon"
                />
                {{ t('game.playAgain') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '../icons/UiIcon.vue'
import { FlappySim, type Phase } from '../../game/flappySim'
import { FlappyRenderer } from '../../game/flappyRender'
import { GameAudio } from '../../game/flappyAudio'
import { theme } from '../../composables/useTheme'
import { gamePlaying } from '../../composables/useGame'
import { modelStatus, modelReady, loadingProgress, loadingText } from '../../composables/useChat'

const { t } = useI18n()

const HIGH_SCORE_KEY = 'flappyHighScore'

const stageEl  = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const againEl  = ref<HTMLButtonElement | null>(null)

const score     = ref(0)
const highScore = ref(readHighScore())
const newBest   = ref(false)
const phase     = ref<Phase>('idle')
const muted     = ref(true)
// Only announce "AI ready" if it finished loading while the game was open
const wasLoading = ref(modelStatus.value === 'loading')
watch(modelStatus, (s) => { if (s === 'loading') wasLoading.value = true })

function readHighScore(): number {
  try { return parseInt(localStorage.getItem(HIGH_SCORE_KEY) ?? '0', 10) || 0 } catch { return 0 }
}

let sim: FlappySim | null = null
let renderer: FlappyRenderer | null = null
let rafId = 0
let lastTime = 0

// ── Loop: real time in, fixed-step physics, interpolated drawing ─────────────

function frame(now: number) {
  if (!sim || !renderer) return
  const dt = lastTime ? (now - lastTime) / 1000 : 0
  lastTime = now

  const events = sim.advance(dt)
  if (events.scored) {
    score.value = sim.score
    audio.score(sim.score)
  }
  if (events.died) audio.crash()
  if (sim.phase !== phase.value) onPhaseChange(sim.phase)

  renderer.render(sim)

  // Nothing moves once the round is over, so stop drawing until the next one
  rafId = sim.phase === 'dead' ? 0 : requestAnimationFrame(frame)
}

function startLoop() {
  if (rafId) return
  lastTime = 0
  rafId = requestAnimationFrame(frame)
}

function stopLoop() {
  cancelAnimationFrame(rafId)
  rafId = 0
}

function onPhaseChange(next: Phase) {
  phase.value = next
  gamePlaying.value = next === 'playing'
  if (next === 'dead') {
    newBest.value = sim!.score > highScore.value
    if (newBest.value) {
      audio.best()
      highScore.value = sim!.score
      try { localStorage.setItem(HIGH_SCORE_KEY, String(sim!.score)) } catch { /* private mode */ }
    }
    nextTick(() => againEl.value?.focus())
  }
}

// ── Input ────────────────────────────────────────────────────────────────────

function flap() {
  if (!sim) return
  if (sim.flap()) {
    audio.flap()
    if (sim.phase !== phase.value) onPhaseChange(sim.phase)
    startLoop()
  }
}

function onPress(e: PointerEvent) {
  if (e.button !== 0) return
  e.preventDefault()          // no text selection or double-tap zoom
  stageEl.value?.focus()
  flap()
}

// Keys only while the game has focus, so typing elsewhere on the page is never hijacked
function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    e.preventDefault()
    if (!e.repeat) flap()
  }
}

function restart() {
  if (!sim) return
  sim.reset()
  score.value = 0
  newBest.value = false
  onPhaseChange('idle')
  stageEl.value?.focus()
  startLoop()
}

// ── Sizing and theme ─────────────────────────────────────────────────────────

let ro: ResizeObserver | null = null
let lastSize = ''

function resize() {
  const el = stageEl.value
  if (!el || !renderer) return
  const { width, height } = el.getBoundingClientRect()
  if (!width || !height) return
  // The ResizeObserver's first callback repeats the size we already built for
  const size = `${Math.round(width)}x${Math.round(height)}`
  if (size === lastSize) return
  lastSize = size
  const worldW = renderer.resize(width, height)
  if (sim) sim.resize(worldW)
  else sim = new FlappySim(worldW)
  renderer.render(sim)
  if (sim.phase !== 'dead') startLoop()
}

watch(theme, (t) => {
  audio.setTheme(t)
  if (!renderer || !sim) return
  renderer.setTheme(t)
  renderer.render(sim)
})

// ── Audio (procedural, muted by default; see game/flappyAudio.ts) ─────────────

const audio = new GameAudio(theme.value)

function toggleMute() {
  muted.value = !muted.value
  audio.setMuted(muted.value)
  stageEl.value?.focus()
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  renderer = new FlappyRenderer(canvasEl.value!)
  renderer.setTheme(theme.value)
  ro = new ResizeObserver(resize)
  ro.observe(stageEl.value!)
  resize()
  stageEl.value?.focus()
})

onUnmounted(() => {
  stopLoop()
  ro?.disconnect()
  audio.dispose()
  gamePlaying.value = false
})
</script>

<style scoped>
/* Fills whatever is left of its card or popup below the header */
.mini-game {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* ── Top bar ── */
.game-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-snow) 6%, transparent);
  background-color: color-mix(in srgb, var(--color-snow) 2%, transparent);
}

.game-stats {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-sm);
  color: var(--color-ash);
}

.best {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.trophy-icon {
  width: 1.4rem;
  height: 1.4rem;
  color: var(--color-amber);
}
.best-value {
  color: var(--color-snow);
  font-weight: 600;
}

.game-ai {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: flex-end;
}

.ai-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  width: 100%;
  max-width: 16rem;
}
.ai-progress-label,
.ai-ready {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: var(--leading-xs);
  white-space: nowrap;
}
.ai-progress-label { color: var(--color-ash); }
.ai-ready          { color: var(--color-moss); }

.progress-track {
  flex: 1;
}
.progress-bar {
  transition-duration: 0.3s;
}

/* ── Play area ── */
.stage {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  user-select: none;
  cursor: pointer;
  touch-action: none;
  outline: none;
}
.stage:focus-visible {
  box-shadow: inset 0 0 0 2px var(--color-amber);
}

.icon-btn {
  flex-shrink: 0;
  width: 3.2rem;
  height: 3.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.8rem;
  background: transparent;
  color: var(--color-ash);
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}
.icon-btn:hover {
  color: var(--color-snow);
  background: color-mix(in srgb, var(--color-snow) 6%, transparent);
}
.icon-btn svg {
  width: 1.8rem;
  height: 1.8rem;
}

.game-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.start-hint {
  position: absolute;
  inset-inline: 0;
  bottom: 22%;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.hint {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 1.3rem;
  color: var(--color-snow);
  background: color-mix(in srgb, var(--color-charcoal) 70%, transparent);
  border: 1px solid var(--color-line-strong);
  border-radius: 2rem;
  padding: 0.6rem 1.4rem;
  backdrop-filter: blur(4px);
}
.hint-icon {
  width: 1.3rem;
  height: 1.3rem;
}

/* ── Game over ── */
.game-over {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: color-mix(in srgb, var(--color-charcoal) 40%, transparent);
  backdrop-filter: blur(2px);
}

.over-card {
  width: min(26rem, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  text-align: center;
  background: var(--color-panel);
  border: 1px solid var(--color-line-strong);
  border-radius: 1.4rem;
  padding: 2.2rem 2rem;
  box-shadow: 0 12px 40px rgb(0 0 0 / 0.25);
}
.eyebrow-mini {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 1.15rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ash);
}

.final-score {
  font-size: var(--text-4xl);
  font-weight: 600;
  line-height: 1;
  color: var(--color-snow);
}

.best-line {
  font-size: var(--text-sm);
  line-height: var(--leading-sm);
  color: var(--color-ash);
}
.best-line.is-new {
  font-weight: 600;
  color: var(--color-amber);
}

.over-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  margin-top: 0.5rem;
}

.again-btn {
  width: 100%;
  justify-content: center;
  padding-block: 0.8rem;
  font-size: var(--text-base);
  line-height: var(--leading-base);
}
.again-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.fade-game-enter-active,
.fade-game-leave-active {
  transition: opacity 0.2s ease, transform 0.22s ease;
}
.fade-game-enter-from,
.fade-game-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
