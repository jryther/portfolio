<template>
  <button
    v-if="!prefersReducedMotion"
    v-tooltip="label"
    type="button"
    class="scene-toggle"
    :class="{ 'is-away': !heroInView }"
    :aria-label="label"
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
import { vTooltip } from '../directives/tooltip'
import { useI18n } from 'vue-i18n'
import { scenePaused, heroInView, toggleScene } from '../composables/useScene'

// Reduced motion already stops the scene, so the control would do nothing
const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const { t } = useI18n()

const label = computed(() => scenePaused.value ? t('toggles.playScene') : t('toggles.pauseScene'))
</script>

<style scoped>
/* Matches the theme toggle and Resume button: bordered, same size, amber on hover */
.scene-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.8rem;
  height: 3.8rem;
  flex-shrink: 0;
  border: 1px solid var(--color-line-strong);
  border-radius: 0.8rem;
  background: transparent;
  color: var(--color-mist);
  cursor: pointer;
  overflow: hidden;
  transition: color 0.2s ease, border-color 0.2s ease,
    opacity 0.25s ease, width 0.3s ease, margin 0.3s ease, border-width 0.3s ease, visibility 0s linear 0s;
}

.scene-toggle:hover {
  color: var(--color-amber);
  border-color: var(--color-amber);
}

/* Hero scrolled away — the scene is already paused, so collapse the control out of the
   header (no dead button, no gap). The border collapses too so no sliver is left behind.
   visibility:hidden also drops it from tab order and the accessibility tree once the fade
   finishes. */
.scene-toggle.is-away {
  width: 0;
  border-width: 0;
  margin-inline-end: -0.75rem;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: color 0.2s ease, border-color 0.2s ease,
    opacity 0.2s ease, width 0.3s ease, margin 0.3s ease, border-width 0.3s ease, visibility 0s linear 0.3s;
}

.scene-toggle svg {
  width: 1.5rem;
  height: 1.5rem;
}
</style>
