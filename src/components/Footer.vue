<template>
  <footer class="site-footer">
    <div class="wrap footer-bar">
      <p class="footer-credit">
        &copy; {{ year }} Josh Ryther <span class="sep">·</span> {{ t('footer.builtWith') }} <span class="sep">·</span> {{ t('footer.madeIn') }}
      </p>

      <div class="footer-links">
        <a
          v-for="link in links"
          :key="link.href"
          v-tooltip="t(link.labelKey)"
          :href="link.href"
          :target="link.external ? '_blank' : undefined"
          :rel="link.external ? 'noreferrer' : undefined"
          :aria-label="t(link.labelKey)"
          class="footer-link"
        >
          <svg
            viewBox="0 0 24 24"
            class="footer-icon"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          ><path :d="link.icon" /></svg>
        </a>
      </div>
    </div>
    <p class="wrap footer-note">
      {{ t('footer.trademark') }}
    </p>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { vTooltip } from '../directives/tooltip'

const { t } = useI18n()

const year = new Date().getFullYear()

const links = [
  {
    labelKey: 'contact.linkedin',
    href: 'https://linkedin.com/in/joshua-ryther-121400109',
    external: true,
    icon: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6ZM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
  },
  {
    labelKey: 'contact.email',
    href: 'mailto:jryther91@gmail.com',
    external: false,
    icon: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm17 2-9 6-9-6',
  },
]
</script>

<style scoped>
.site-footer {
  border-top: 1px solid var(--color-line);
}

.footer-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding-block: 2.5rem;
}

.footer-credit {
  font-size: var(--text-sm);
  line-height: var(--leading-sm);
  color: var(--color-ash);
}
.footer-credit .sep {
  color: var(--color-smoke);
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.6rem;
  height: 3.6rem;
  border-radius: 0.5rem;
  color: var(--color-ash);
  transition: color 0.2s ease, background-color 0.2s ease;
}
.footer-link:hover {
  color: var(--color-amber);
  background-color: color-mix(in srgb, var(--color-snow) 5%, transparent);
}

.footer-icon {
  width: 1.8rem;
  height: 1.8rem;
}

.footer-note {
  padding-bottom: 2rem;
  font-size: var(--text-2xs);
  color: var(--color-ash);
}

@media (width < 768px) {
  .footer-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
