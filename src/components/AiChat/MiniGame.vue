<template>
  <div class="mini-game flex flex-col min-h-0">
    <!-- Top bar: score, AI status, controls -->
    <div class="flex items-center gap-4 px-4 py-[0.8rem] border-b border-snow/[.06] bg-snow/[.02] flex-shrink-0">
      <div class="flex items-center gap-5 text-sm text-ash font-mono">
        <span
          class="flex items-center gap-[0.4rem]"
          :title="t('game.bestTitle')"
        >
          <UiIcon
            name="trophy"
            class="w-[1.4rem] h-[1.4rem] text-amber"
          />
          {{ t('game.best') }} <span class="text-snow font-semibold">{{ highScore }}</span>
        </span>
      </div>

      <div class="flex-1 min-w-0 flex justify-end">
        <div
          v-if="modelStatus === 'loading'"
          class="flex items-center gap-3 min-w-0 w-full max-w-[16rem]"
          :title="loadingText"
        >
          <span class="text-xs text-ash font-mono whitespace-nowrap">{{ t('game.aiProgress', { progress: loadingProgress }) }}</span>
          <div class="flex-1 h-[0.4rem] bg-snow/[.08] rounded-full overflow-hidden">
            <div
              class="h-full bg-amber rounded-full transition-[width] duration-300 ease-out"
              :style="{ width: loadingProgress + '%' }"
            />
          </div>
        </div>
        <span
          v-else-if="modelReady && wasLoading"
          class="text-xs font-mono text-moss whitespace-nowrap"
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
      class="stage relative flex-1 min-h-0 overflow-hidden select-none"
      tabindex="0"
      role="application"
      :aria-label="t('game.stage')"
      @pointerdown="onPress"
      @keydown="onKeyDown"
    >
      <canvas
        ref="canvasEl"
        class="absolute inset-0 w-full h-full block"
      />

      <!-- Start hint -->
      <Transition name="fade-game">
        <div
          v-if="phase === 'idle'"
          class="absolute inset-x-0 bottom-[22%] flex justify-center pointer-events-none"
        >
          <span class="hint">
            <UiIcon
              name="play"
              class="w-[1.3rem] h-[1.3rem]"
            />
            {{ t('game.hint') }}
          </span>
        </div>
      </Transition>

      <!-- Game over -->
      <Transition name="fade-game">
        <div
          v-if="phase === 'dead'"
          class="absolute inset-0 flex items-center justify-center p-6 bg-charcoal/40 backdrop-blur-[2px]"
          @pointerdown.stop
        >
          <div class="over-card">
            <p class="eyebrow-mini">
              {{ t('game.over') }}
            </p>
            <p class="text-4xl font-semibold text-snow m-0 leading-none">
              {{ score }}
            </p>
            <p
              class="text-sm m-0"
              :class="newBest ? 'text-amber font-semibold' : 'text-ash'"
            >
              {{ newBest ? t('game.newBest') : t('game.bestScore', { score: highScore }) }}
            </p>
            <div class="flex flex-col gap-3 w-full mt-2">
              <button
                ref="againEl"
                class="button w-full justify-center py-[0.8rem] text-base"
                @click="restart"
              >
                <UiIcon
                  name="refresh"
                  class="w-[1.5rem] h-[1.5rem]"
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
.stage {
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
