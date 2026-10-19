<template>
  <button
    v-if="!prefersReducedMotion"
    type="button"
    class="scene-toggle"
    :class="{ 'is-away': !heroInView }"
    :aria-label="label"
    :title="label"
    @click="toggleScene"
  >
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        v-if="scenePaused"
        d="M5 3.5v9l7.5-4.5Z"
      />
      <path
        v-else
        d="M4.5 3.5h2.2v9H4.5zM9.3 3.5h2.2v9H9.3z"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { scenePaused, heroInView, toggleScene } from '../composables/useScene'

// Reduced motion already stops the scene, so the control would do nothing
const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const label = computed(() => scenePaused.value ? 'Play background animation' : 'Pause background animation')
</script>

<style scoped>
/* Deliberately quieter than the theme toggle — icon only, no border */
.scene-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.2rem;
  height: 3.2rem;
  flex-shrink: 0;
  border: none;
  border-radius: 0.8rem;
  background: transparent;
  color: var(--color-ash);
  cursor: pointer;
  overflow: hidden;
  transition: color 0.2s ease, background-color 0.2s ease,
    opacity 0.25s ease, width 0.3s ease, margin 0.3s ease, visibility 0s linear 0s;
}

/* Hero scrolled away — the scene is already paused, so collapse the control out of the
   header (no dead button, no gap). visibility:hidden also drops it from tab order and the
   accessibility tree once the fade finishes. */
.scene-toggle.is-away {
  width: 0;
  margin-inline-end: calc(var(--spacing) * -3);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: color 0.2s ease, background-color 0.2s ease,
    opacity 0.2s ease, width 0.3s ease, margin 0.3s ease, visibility 0s linear 0.3s;
}

.scene-toggle:hover {
  color: var(--color-snow);
  background-color: color-mix(in srgb, var(--color-snow) 6%, transparent);
}

.scene-toggle svg {
  width: 1.3rem;
  height: 1.3rem;
}
</style>
