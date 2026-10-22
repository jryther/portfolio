<template>
  <button
    v-tooltip="isLight ? t('toggles.toDark') : t('toggles.toLight')"
    type="button"
    class="theme-toggle"
    :class="{ light: isLight }"
    :aria-label="isLight ? t('toggles.toDark') : t('toggles.toLight')"
    @click="toggleTheme"
  >
    <!-- Sun -->
    <svg
      class="icon sun"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="4"
      />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </svg>
    <!-- Moon -->
    <svg
      class="icon moon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { vTooltip } from '../directives/tooltip'
import { useI18n } from 'vue-i18n'
import { theme, toggleTheme } from '../composables/useTheme'

const { t } = useI18n()

const isLight = computed(() => theme.value === 'light')
</script>

<style scoped>
.theme-toggle {
  position: relative;
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
  transition: color 0.2s ease, border-color 0.2s ease;
}

.theme-toggle:hover {
  color: var(--color-amber);
  border-color: var(--color-amber);
}

/* Icons swap with a small rise/set rotation */
.icon {
  position: absolute;
  width: 1.8rem;
  height: 1.8rem;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

/* Dark mode shows the sun (what you'll switch to); light mode shows the moon */
.moon                { transform: translateY(150%) rotate(-60deg); opacity: 0; }
.light .sun          { transform: translateY(-150%) rotate(90deg); opacity: 0; }
.light .moon         { transform: none; opacity: 1; }
</style>
