<template>
  <!-- Shows the language it switches to (like the theme toggle shows the theme), labelled in
       that language so a visitor who can't read the current one still finds it -->
  <button
    type="button"
    class="lang-toggle"
    :lang="t('toggles.languageLang')"
    :aria-label="t('toggles.language')"
    :title="t('toggles.language')"
    @click="toggleLocale"
  >
    {{ t('toggles.languageCode') }}
  </button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { toggleLocale } from '../i18n'

const { t } = useI18n()
</script>

<style scoped>
/* Matches the theme toggle: bordered, same size, amber on hover */
.lang-toggle {
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
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.lang-toggle:hover {
  color: var(--color-amber);
  border-color: var(--color-amber);
}
</style>
