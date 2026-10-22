<template>
  <section
    id="contact"
    class="section bg-topo"
  >
    <div class="wrap contact-grid">
      <div data-aos="fade-up">
        <p class="eyebrow">
          {{ t('contact.eyebrow') }}
        </p>
        <h2 class="section-title contact-title">
          {{ t('contact.title') }}
        </h2>
        <p class="lede">
          {{ t('contact.intro1') }}
        </p>
        <p class="lede">
          {{ t('contact.intro2') }}
        </p>

        <ul class="contact-list">
          <li
            v-for="item in contactLinks"
            :key="item.key"
          >
            <component
              :is="item.href ? 'a' : 'div'"
              :href="item.href"
              :target="item.external ? '_blank' : undefined"
              :rel="item.external ? 'noreferrer' : undefined"
              class="contact-row"
              :class="{ 'is-link': item.href }"
            >
              <span class="contact-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                ><path :d="item.icon" /></svg>
              </span>
              <span class="contact-text">
                <span class="label is-small">{{ t(`contact.${item.key}`) }}</span>
                <span class="contact-value">{{ item.value ?? t(`contact.${item.key}Value`) }}</span>
              </span>
            </component>
          </li>
        </ul>
      </div>

      <div
        class="card form-card"
        data-aos="fade-up"
        data-aos-delay="100"
      >
        <h3 class="form-title">
          {{ t('contact.formTitle') }}
        </h3>
        <p class="form-intro">
          {{ t('contact.replyTime') }}
        </p>
        <ContactForm />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ContactForm from './ContactForm.vue'
import { CONTACT_EMAIL, LINKEDIN_URL, EMAIL_ICON, LINKEDIN_ICON } from '../data/contact'

const { t } = useI18n()

// Labels are contact.<key> in the locale files
const contactLinks = [
  {
    key: 'email',
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
    external: false,
    icon: EMAIL_ICON,
  },
  {
    key: 'linkedin',
    value: 'in/joshua-ryther',
    href: LINKEDIN_URL,
    external: true,
    icon: LINKEDIN_ICON,
  },
  {
    key: 'location',
    value: undefined,  // contact.locationValue: written per language
    href: undefined,
    external: false,
    icon: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  },
]
</script>

<style scoped>
.contact-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 4rem;
}

@media (min-width: 1024px) {
  .contact-grid {
    grid-template-columns: 1fr 1.15fr;
    gap: 6rem;
  }
}

.contact-title {
  margin-top: 1.5rem;
  margin-bottom: 2rem;
}

.lede + .lede {
  margin-top: 1rem;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 3rem;
}

.contact-text {
  display: flex;
  flex-direction: column;
}

.form-card {
  align-self: flex-start;
  padding: 2.5rem;
}

@media (width < 480px) {
  .form-card { padding: 1.75rem; }
}

.form-title {
  margin-bottom: 0.5rem;
  font-size: var(--text-xl);
  line-height: var(--leading-xl);
  font-weight: 600;
  color: var(--color-snow);
}

.form-intro {
  margin-bottom: 2rem;
  font-size: var(--text-base);
  line-height: var(--leading-base);
  color: var(--color-mist);
}

.contact-row {
  display: flex;
  align-items: center;
  gap: 1.6rem;
  padding: 1.2rem 1.4rem;
  margin-inline: -1.4rem;
  border-radius: 1rem;
  transition: background-color 0.2s ease;
}

.contact-row.is-link:hover {
  background-color: color-mix(in srgb, var(--color-snow) 4%, transparent);
}

.contact-value {
  font-size: var(--text-body);
  color: var(--color-snow);
  transition: color 0.2s ease;
}

.contact-row.is-link:hover .contact-value {
  color: var(--color-amber);
}

.contact-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4.4rem;
  height: 4.4rem;
  flex-shrink: 0;
  border: 1px solid var(--color-line);
  border-radius: 1rem;
  background-color: var(--color-surface);
  color: var(--color-amber);
}

.contact-icon svg {
  width: 2rem;
  height: 2rem;
}
</style>
