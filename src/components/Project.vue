<template>
  <section
    id="projects"
    class="section"
  >
    <div class="wrap">
      <p
        class="eyebrow"
        data-aos="fade-up"
      >
        {{ t('work.eyebrow') }}
      </p>
      <div
        class="mt-6 mb-14"
        data-aos="fade-up"
      >
        <h2 class="section-title">
          {{ t('work.title') }}
        </h2>
        <p class="role-line mt-5">
          <span class="text-snow font-semibold">{{ t('work.role') }}</span>
          <span aria-hidden="true">·</span>
          <span>Pearson</span>
          <span aria-hidden="true">·</span>
          <span>{{ t('work.dates') }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ t('work.remote') }}</span>
        </p>
      </div>

      <!-- Featured: the main project -->
      <article
        class="card spotlight featured"
        data-aos="fade-up"
        @mousemove="trackPointer"
      >
        <div class="featured-main">
          <p class="eyebrow-mini">
            {{ t('work.mainProject') }}
          </p>
          <h3 class="text-3xl font-semibold text-snow mt-3 max-xs:text-2xl">
            TestNav
          </h3>
          <p class="text-base text-mist leading-[1.75] mt-4">
            {{ t('work.testnavSummary') }}
          </p>

          <ul class="mt-8 flex flex-col gap-4">
            <li
              v-for="point in featured"
              :key="point"
              class="flex gap-3 text-[1.45rem] leading-[1.65] text-mist"
            >
              <svg
                viewBox="0 0 16 16"
                class="w-[1.4rem] h-[1.4rem] mt-[0.4rem] flex-shrink-0 text-moss"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              ><path d="m3 8.5 3 3 7-7" /></svg>
              {{ point }}
            </li>
          </ul>

          <div class="mt-10 flex flex-wrap items-center gap-3">
            <span class="font-mono text-xs uppercase tracking-[0.12em] text-ash mr-2">{{ t('work.availableOn') }}</span>
            <a
              href="https://apps.apple.com/us/app/testnav/id818779127"
              target="_blank"
              rel="noreferrer"
              class="button-ghost text-[1.35rem] py-[0.8rem] px-[1.2rem]"
            >
              <svg
                class="w-[1.6rem] h-[1.6rem]"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              App Store
            </a>
            <a
              href="https://apps.microsoft.com/detail/9nd5fc7rppx1?hl=en-US&gl=US"
              target="_blank"
              rel="noreferrer"
              class="button-ghost text-[1.35rem] py-[0.8rem] px-[1.2rem]"
            >
              <svg
                class="w-[1.4rem] h-[1.4rem]"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
              </svg>
              Microsoft Store
            </a>
          </div>
        </div>

        <!-- Results -->
        <div class="featured-stats">
          <dl class="stats">
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="stat"
            >
              <dt class="stat-label">
                {{ stat.label }}
              </dt>
              <dd class="stat-value">
                {{ stat.value }}
              </dd>
            </div>
          </dl>
          <p class="font-mono text-2xs text-ash mt-4">
            {{ t('work.estimates') }}
          </p>
        </div>
      </article>

      <!-- Supporting work around the main project -->
      <p
        class="eyebrow-mini mt-16 mb-6"
        data-aos="fade-up"
      >
        {{ t('work.aroundPlatform') }}
      </p>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="(item, index) in supporting"
          :key="item.name"
          class="card spotlight p-8 flex flex-col"
          data-aos="fade-up"
          :data-aos-delay="index * 60"
          @mousemove="trackPointer"
        >
          <h3 class="text-xl font-semibold text-snow">
            {{ item.name }}
          </h3>
          <p class="text-[1.4rem] text-mist leading-[1.65] mt-3 mb-6">
            {{ item.description }}
          </p>
          <p class="result mt-auto">
            <span class="result-value">{{ item.result }}</span>
            <span class="result-label">{{ item.resultLabel }}</span>
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { messageList } from '../i18n'

// Work at Pearson, in order of emphasis: the TestNav client
// first (testing, then accessibility), supporting systems second. Describes what each system
// does, not what it's built on, so the section doesn't map out the employer's architecture.
// The text lives under work.* in the locale files.

interface Stat {
  value: string
  label: string
}

interface Supporting {
  name: string
  description: string
  result: string
  resultLabel: string
}

const { t } = useI18n()

// Feed the cursor position to the .spotlight glow
function trackPointer(e: MouseEvent) {
  const el   = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
  el.style.setProperty('--my', `${e.clientY - rect.top}px`)
}

// Scale comes first: it's the context that gives every other number its weight
const stats      = computed(() => messageList<Stat>('work.stats'))
const featured   = computed(() => messageList('work.featured'))
const supporting = computed(() => messageList<Supporting>('work.supporting'))
</script>

<style scoped>
.role-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 1rem;
  font-family: var(--font-mono);
  font-size: 1.35rem;
  color: var(--color-ash);
}

.eyebrow-mini {
  font-family: var(--font-mono);
  font-size: 1.2rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ash);
}

/* Featured card: story on the left, results on the right (stacked on small screens) */
.featured {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 3.2rem;
  padding: 4rem;
}
@media (min-width: 1024px) {
  .featured {
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    gap: 5.6rem;
    padding: 4.8rem;
  }
}
@media (max-width: 480px) {
  .featured { padding: 2.8rem 2.2rem; }
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
  margin: 0;
}
.stat {
  display: flex;
  flex-direction: column-reverse;   /* value reads first visually, label first for screen readers */
  justify-content: flex-end;
  gap: 0.8rem;
  padding: 2rem 1.8rem;
  border: 1px solid var(--color-line);
  border-radius: 1.2rem;
  background: color-mix(in srgb, var(--color-snow) 3%, transparent);
}
.stat-value {
  margin: 0;
  font-size: clamp(2.2rem, 2.4vw, 3rem);
  font-weight: 650;
  line-height: 1.05;
  white-space: nowrap;
  letter-spacing: -0.02em;
  color: var(--color-amber);
}
.stat-label {
  font-size: 1.3rem;
  line-height: 1.45;
  color: var(--color-mist);
}

.result {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding-top: 1.6rem;
  border-top: 1px solid var(--color-line);
}
.result-value {
  font-size: 2.2rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--color-amber);
}
.result-label {
  font-size: 1.3rem;
  line-height: 1.45;
  min-height: calc(1.3rem * 1.45 * 2);   /* two lines, so results line up across cards */
  color: var(--color-ash);
}
</style>
