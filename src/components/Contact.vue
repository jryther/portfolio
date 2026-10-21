<template>
  <section
    id="contact"
    class="section bg-topo"
  >
    <div class="wrap grid grid-cols-1 gap-16 lg:grid-cols-[1fr_1.15fr] lg:gap-24">
      <div data-aos="fade-up">
        <p class="eyebrow">
          06 — Contact
        </p>
        <h2 class="section-title mt-6 mb-8">
          Let's connect
        </h2>
        <p class="text-body leading-[1.8] text-mist mb-4">
          I'm always interested in discussing new opportunities, technical challenges, and collaborations.
        </p>
        <p class="text-body leading-[1.8] text-mist">
          Whether you're looking for a full-stack developer, need technical insights, or just want to chat about software engineering, feel free to reach out!
        </p>

        <ul class="mt-12 flex flex-col gap-3">
          <li
            v-for="item in contactLinks"
            :key="item.label"
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
              <span class="flex flex-col">
                <span class="font-mono text-2xs uppercase tracking-[0.12em] text-ash">{{ item.label }}</span>
                <span class="contact-value text-body text-snow">{{ item.value }}</span>
              </span>
            </component>
          </li>
        </ul>
      </div>

      <div
        class="card p-10 self-start max-xs:p-7"
        data-aos="fade-up"
        data-aos-delay="100"
      >
        <h3 class="text-xl font-semibold text-snow mb-2">
          Send a message
        </h3>
        <p class="text-base text-mist mb-8">
          I usually reply within a day or two.
        </p>
        <ContactForm />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import ContactForm from './ContactForm.vue'

// Lucide-style 24px line icons
const contactLinks = [
  {
    label: 'Email',
    value: 'jryther91@gmail.com',
    href: 'mailto:jryther91@gmail.com',
    external: false,
    icon: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm17 2-9 6-9-6',
  },
  {
    label: 'LinkedIn',
    value: 'in/joshua-ryther',
    href: 'https://linkedin.com/in/joshua-ryther-121400109',
    external: true,
    icon: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6ZM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
  },
  {
    label: 'Location',
    value: 'Salem, Oregon',
    href: undefined,
    external: false,
    icon: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  },
]
</script>

<style scoped>
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
