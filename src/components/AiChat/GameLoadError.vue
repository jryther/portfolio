<template>
  <!-- In place of the game when its code couldn't download; the header icon goes back to chat -->
  <div
    class="game-load-error"
    role="alert"
  >
    <UiIcon
      name="alert-circle"
      class="error-icon"
    />
    <p class="error-text">
      {{ t('game.loadError') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiIcon from '../icons/UiIcon.vue'

const { t } = useI18n()
</script>

<style scoped>
.game-load-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2.4rem;
  text-align: center;
}

.error-icon {
  width: 2.8rem;
  height: 2.8rem;
  color: var(--color-rust);
}

.error-text {
  max-width: 32rem;
  font-size: var(--text-base);
  line-height: var(--leading-base);
  color: var(--color-mist);
}
</style>
