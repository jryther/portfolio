<template>
  <div
    class="chat-header"
    :class="{ 'is-large': large }"
  >
    <div class="chat-header-title">
      <SparkleIcon class="sparkle" />
      <span class="chat-header-text">Ask About Josh</span>
    </div>
    <div class="chat-header-actions">
      <!-- Extra status (e.g. the full section's AI status pill) sits before the buttons -->
      <slot />
      <button
        class="header-btn"
        :class="{ 'is-active': showGame, 'is-hinting': slowLoad && !showGame }"
        :aria-pressed="showGame"
        :aria-label="gameLabel"
        :title="gameLabel"
        @click="showGame = !showGame"
      >
        <UiIcon name="game" />
        <span
          v-if="slowLoad && !showGame"
          class="hint-dot"
        />
      </button>
      <button
        v-if="closable"
        class="header-btn"
        aria-label="Close chat"
        title="Close"
        @click="emit('close')"
      >
        <UiIcon name="close" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SparkleIcon from '../icons/SparkleIcon.vue'
import UiIcon from '../icons/UiIcon.vue'
import { slowLoad } from '../../composables/useChat'

// Header bar shared by the floating popup and the full chat section.
// large: the section's roomier version. closable: show a close button (popup only)
defineProps<{ large?: boolean, closable?: boolean }>()
const emit = defineEmits<{ close: [] }>()
const showGame = defineModel<boolean>('showGame', { required: true })

const gameLabel = computed(() => {
  if (showGame.value) return 'Back to chat'
  return slowLoad.value ? 'Play a game while the AI loads' : 'Play a game'
})
</script>

<style scoped>
.chat-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.2rem;
  background-color: color-mix(in srgb, var(--color-snow) 4%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--color-snow) 6%, transparent);
}

.chat-header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-snow);
  font-weight: 600;
  font-size: var(--text-lg);
  line-height: var(--leading-lg);
}

.chat-header-text {
  margin-left: 0.25rem;
}

.sparkle {
  width: 1.8rem;
  height: 1.8rem;
  color: var(--color-amber);
}

.chat-header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.header-btn {
  position: relative;
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
.header-btn svg {
  width: 1.8rem;
  height: 1.8rem;
}

/* Full chat section: a little roomier */
.is-large {
  gap: 1rem;
  padding: 1.2rem 1.6rem;
}
.is-large .chat-header-text {
  margin-left: 0;
}
.is-large .chat-header-actions {
  gap: 0.75rem;
}
.is-large .header-btn {
  width: 3.4rem;
  height: 3.4rem;
}
.is-large .header-btn svg {
  width: 1.9rem;
  height: 1.9rem;
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
</style>
