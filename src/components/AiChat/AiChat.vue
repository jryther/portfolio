<template>
  <div class="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-3 pointer-events-none max-xs:bottom-4 max-xs:right-4">
    <!-- Floating toggle button; steps aside while the full chat section is on screen -->
    <Transition name="fab">
      <button
        v-show="fabVisible"
        class="pointer-events-auto w-[5.6rem] h-[5.6rem] rounded-2xl bg-amber border border-golden/40 cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.3),0_0_0_6px_color-mix(in_srgb,var(--color-amber)_10%,transparent)] flex items-center justify-center transition-[background] duration-200 flex-shrink-0 hover:bg-golden"
        aria-label="Ask about Josh"
        title="Ask about Josh"
        @click="toggleModal"
      >
        <SparkleIcon class="w-[2.4rem] h-[2.4rem] text-ink" />
      </button>
    </Transition>

    <!-- Modal panel -->
    <Transition name="chat-panel">
      <div
        v-if="isOpen"
        role="dialog"
        aria-label="Ask about Josh"
        class="pointer-events-auto absolute bottom-0 right-0 bg-panel border border-line-strong rounded-[1.4rem] flex flex-col overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.35)] z-[1] max-xs:w-[calc(100vw-2rem)] max-xs:max-h-[70vh]"
        :style="modalStyle"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-[1.2rem] py-5 bg-snow/[.04] border-b border-snow/[.06] font-semibold text-lg text-snow flex-shrink-0">
          <div class="flex items-center gap-3">
            <SparkleIcon class="w-[1.8rem] h-[1.8rem] text-amber" />
            <span class="ml-1 text-lg">Ask About Josh</span>
          </div>
          <button
            class="bg-transparent border-none text-smoke text-[1.6rem] cursor-pointer leading-none w-9 h-9 flex items-center justify-center rounded transition-[color,background] duration-200 hover:text-snow hover:bg-snow/[.06]"
            aria-label="Close chat"
            @click="toggleModal"
          >
            ✕
          </button>
        </div>

        <ChatPanel class="flex-1" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import SparkleIcon from '../icons/SparkleIcon.vue'
import ChatPanel from './ChatPanel.vue'
import { openChat, chatSectionInView } from '../../composables/useChat'

const isOpen     = ref<boolean>(false)
const fabVisible = ref<boolean>(true)

// Matches the .chat-panel-leave-active duration below
const PANEL_LEAVE_MS = 280

const modalStyle = {
  width:     '44rem',
  maxWidth:  'calc(100vw - 2rem)',  // inline width beats the max-xs class, so cap it here
  minHeight: '46rem',
  maxHeight: '56rem',
}

function toggleModal() {
  isOpen.value = !isOpen.value
  if (isOpen.value) openChat()
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
    hideTimer = setTimeout(() => { fabVisible.value = !chatSectionInView.value }, PANEL_LEAVE_MS)
  } else {
    fabVisible.value = false
  }
})
</script>

<style scoped>
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
</style>
