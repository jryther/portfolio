<template>
  <div class="chat-dock">
    <!-- Floating toggle button; steps aside while the popup is open (so its outline never
         peeks out behind it) and while the full chat section is on screen -->
    <Transition name="fab">
      <button
        v-show="fabVisible && !isOpen"
        ref="fabEl"
        class="fab"
        :aria-label="t('chat.open')"
        :title="t('chat.open')"
        @click="toggleModal"
      >
        <SparkleIcon class="fab-icon" />
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
          class="backtop"
          :aria-label="t('chat.backToTop')"
          :title="t('chat.backToTop')"
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
        :aria-label="t('chat.open')"
        class="chat-popup"
        @keydown.esc.stop="toggleModal"
      >
        <ChatHeader
          v-model:show-game="showGame"
          closable
          @close="toggleModal"
        />

        <MiniGame v-if="showGame" />
        <ChatPanel
          v-else
          @play-game="showGame = true"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import SparkleIcon from '../icons/SparkleIcon.vue'
import ChatPanel from './ChatPanel.vue'
import ChatHeader from './ChatHeader.vue'
import UiIcon from '../icons/UiIcon.vue'
import { openChat, chatSectionInView } from '../../composables/useChat'
import { prefetchWhenIdle } from '../../composables/useGame'

const { t } = useI18n()

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
/* Bottom-right corner stack: chat button, back to top, and the popup over both.
   The stack itself ignores the pointer so it never blocks the page beside its buttons */
.chat-dock {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  pointer-events: none;
}

@media (width < 480px) {
  .chat-dock {
    bottom: 1rem;
    right: 1rem;
  }
}

.fab {
  pointer-events: auto;
  flex-shrink: 0;
  width: 5.6rem;
  height: 5.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--color-golden) 40%, transparent);
  border-radius: 1rem;
  background-color: var(--color-amber);
  cursor: pointer;
  box-shadow:
    0 8px 30px rgb(0 0 0 / 0.3),
    0 0 0 6px color-mix(in srgb, var(--color-amber) 10%, transparent);
  transition: background 0.2s ease;
}
.fab:hover {
  background-color: var(--color-golden);
}

.fab-icon {
  width: 2.4rem;
  height: 2.4rem;
  color: var(--color-ink);
}

.chat-popup {
  pointer-events: auto;
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 44rem;
  max-width: calc(100vw - 2rem);
  /* Short screens (landscape phones, an open keyboard) shrink it so the header and close
     button stay on screen */
  min-height: min(46rem, calc(100dvh - 4rem));
  max-height: min(56rem, calc(100dvh - 4rem));
  background-color: var(--color-panel);
  border: 1px solid var(--color-line-strong);
  border-radius: 1.4rem;
  box-shadow: 0 8px 40px rgb(0 0 0 / 0.35);
}

[role="dialog"]:focus {
  outline: none;   /* focus parks here on open; the controls inside show their own focus rings */
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
  pointer-events: auto;
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
  margin-top: -0.75rem;   /* cancels the dock's gap */
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .backtop-enter-active,
  .backtop-leave-active { transition: none; }
}
</style>
