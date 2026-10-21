<template>
  <div class="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-3 pointer-events-none max-xs:bottom-4 max-xs:right-4">
    <!-- Floating toggle button; steps aside while the popup is open (so its outline never
         peeks out behind it) and while the full chat section is on screen -->
    <Transition name="fab">
      <button
        v-show="fabVisible && !isOpen"
        ref="fabEl"
        class="pointer-events-auto w-[5.6rem] h-[5.6rem] rounded-2xl bg-amber border border-golden/40 cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.3),0_0_0_6px_color-mix(in_srgb,var(--color-amber)_10%,transparent)] flex items-center justify-center transition-[background] duration-200 flex-shrink-0 hover:bg-golden"
        aria-label="Ask about Josh"
        title="Ask about Josh"
        @click="toggleModal"
      >
        <SparkleIcon class="w-[2.4rem] h-[2.4rem] text-ink" />
      </button>
    </Transition>

    <!-- Back to top: slides in below the chat button once the visitor is past the first screen.
         Hidden while the popup is open, since the popup covers this corner -->
    <Transition name="backtop">
      <div
        v-if="pastFirstScreen && !isOpen"
        class="backtop-slot"
      >
        <button
          class="backtop pointer-events-auto"
          aria-label="Back to top"
          title="Back to top"
          @click="backToTop"
        >
          <UiIcon name="arrow-up" />
        </button>
      </div>
    </Transition>

    <!-- Modal panel -->
    <Transition name="chat-panel">
      <div
        v-if="isOpen"
        ref="panelEl"
        role="dialog"
        tabindex="-1"
        aria-label="Ask about Josh"
        class="pointer-events-auto absolute bottom-0 right-0 bg-panel border border-line-strong rounded-[1.4rem] flex flex-col overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.35)] z-[1] max-xs:w-[calc(100vw-2rem)] max-xs:max-h-[70vh]"
        :style="modalStyle"
        @keydown.esc.stop="toggleModal"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-[1.2rem] py-5 bg-snow/[.04] border-b border-snow/[.06] font-semibold text-lg text-snow flex-shrink-0">
          <div class="flex items-center gap-3">
            <SparkleIcon class="w-[1.8rem] h-[1.8rem] text-amber" />
            <span class="ml-1 text-lg">Ask About Josh</span>
          </div>
          <div class="flex items-center gap-1">
            <button
              class="header-btn"
              :class="{ 'is-active': showGame, 'is-hinting': slowLoad && !showGame }"
              :aria-pressed="showGame"
              :aria-label="showGame ? 'Back to chat' : slowLoad ? 'Play a game while the AI loads' : 'Play a game'"
              :title="showGame ? 'Back to chat' : slowLoad ? 'Play a game while the AI loads' : 'Play a game'"
              @click="showGame = !showGame"
            >
              <UiIcon name="game" />
              <span
                v-if="slowLoad && !showGame"
                class="hint-dot"
              />
            </button>
            <button
              class="header-btn"
              aria-label="Close chat"
              title="Close"
              @click="toggleModal"
            >
              <UiIcon name="close" />
            </button>
          </div>
        </div>

        <MiniGame
          v-if="showGame"
          class="flex-1"
        />
        <ChatPanel
          v-else
          class="flex-1"
          @play-game="showGame = true"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import SparkleIcon from '../icons/SparkleIcon.vue'
import ChatPanel from './ChatPanel.vue'
import UiIcon from '../icons/UiIcon.vue'
import { openChat, chatSectionInView, slowLoad } from '../../composables/useChat'
import { prefetchWhenIdle } from '../../composables/useGame'

// The game's code downloads in the background once the chat opens, so the game icon is instant
const loadGame = () => import('./MiniGame.vue')
const MiniGame = defineAsyncComponent(loadGame)

const isOpen     = ref<boolean>(false)
const fabVisible = ref<boolean>(true)
const showGame   = ref<boolean>(false)
const fabEl      = ref<HTMLButtonElement | null>(null)
const panelEl    = ref<HTMLElement | null>(null)

// Matches the .chat-panel-leave-active duration below
const PANEL_LEAVE_MS = 280

const modalStyle = {
  width:     '44rem',
  maxWidth:  'calc(100vw - 2rem)',  // inline width beats the max-xs class, so cap it here
  minHeight: '46rem',
  maxHeight: '56rem',
}

async function toggleModal() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    openChat()
    prefetchWhenIdle(loadGame)
  } else {
    showGame.value = false   // reopening starts back on the chat
  }
  // The button hides while the popup is open, so hand keyboard focus across: into the popup
  // (not the text box, which would pop the phone keyboard), and back to the button on close
  await nextTick()
  if (isOpen.value) panelEl.value?.focus({ preventScroll: true })
  else if (fabVisible.value) fabEl.value?.focus({ preventScroll: true })
}

// Back to top shows once the visitor has scrolled a full screen down
const pastFirstScreen = ref<boolean>(false)
function onScroll() {
  pastFirstScreen.value = window.scrollY > window.innerHeight
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))

function backToTop() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  // Keyboard focus goes to the top too (the header's home link), so the next Tab continues from
  // there instead of from the bottom of the page
  document.querySelector<HTMLElement>('header a')?.focus({ preventScroll: true })
}

// The full chat section is on screen: close the popup first, then let the button go
let hideTimer: ReturnType<typeof setTimeout> | undefined
watch(chatSectionInView, (inView) => {
  clearTimeout(hideTimer)
  if (!inView) {
    fabVisible.value = true
    return
  }
  if (isOpen.value) {
    isOpen.value = false
    showGame.value = false
    hideTimer = setTimeout(() => { fabVisible.value = !chatSectionInView.value }, PANEL_LEAVE_MS)
  } else {
    fabVisible.value = false
  }
})
</script>

<style scoped>
[role="dialog"]:focus {
  outline: none;   /* focus parks here on open; the controls inside show their own focus rings */
}

.header-btn {
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
.header-btn:hover {
  color: var(--color-snow);
  background: color-mix(in srgb, var(--color-snow) 6%, transparent);
}
.header-btn.is-active {
  color: var(--color-amber);
  background: color-mix(in srgb, var(--color-amber) 12%, transparent);
}
.header-btn {
  position: relative;
}
/* The AI is still loading: point at the game */
.header-btn.is-hinting {
  color: var(--color-amber);
  animation: hint-pulse 1.8s ease-out infinite;
}
.hint-dot {
  position: absolute;
  top: 0.45rem;
  right: 0.45rem;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: var(--color-amber);
  box-shadow: 0 0 0 2px var(--color-panel);
}
@keyframes hint-pulse {
  0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-amber) 45%, transparent); }
  70%  { box-shadow: 0 0 0 0.8rem color-mix(in srgb, var(--color-amber) 0%, transparent); }
  100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-amber) 0%, transparent); }
}
@media (prefers-reduced-motion: reduce) {
  .header-btn.is-hinting { animation: none; }
}
.header-btn svg {
  width: 1.8rem;
  height: 1.8rem;
}

/* ── Panel slide-up transition ── */
.chat-panel-enter-active,
.chat-panel-leave-active {
  transition: opacity 0.25s ease, transform 0.28s ease;
}
.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(1.5rem) scale(0.97);
}

/* ── Floating button leaving / returning ── */
.fab-enter-active,
.fab-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: translateY(1rem) scale(0.85);
}

/* ── Back to top ── */
/* As wide as the chat button, so the smaller button sits centred under it */
.backtop-slot {
  width: 5.6rem;
  height: 4.4rem;
  display: flex;
  justify-content: center;
}
.backtop {
  width: 4.4rem;
  height: 4.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 1.2rem;
  background: var(--color-panel);
  border: 1px solid var(--color-line-strong);
  color: var(--color-mist);
  cursor: pointer;
  box-shadow: 0 6px 20px rgb(0 0 0 / 0.25);
  transition: color 0.2s ease, border-color 0.2s ease;
}
.backtop:hover {
  color: var(--color-amber);
  border-color: var(--color-amber);
}
.backtop svg {
  width: 2rem;
  height: 2rem;
}
/* The slot grows from nothing (taking the gap with it), so the chat button glides up to make room */
.backtop-enter-active,
.backtop-leave-active {
  transition: height 0.25s ease, margin-top 0.25s ease, opacity 0.25s ease;
}
.backtop-enter-from,
.backtop-leave-to {
  height: 0;
  margin-top: -0.75rem;   /* cancels the container's gap-3 */
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .backtop-enter-active,
  .backtop-leave-active { transition: none; }
}
</style>
