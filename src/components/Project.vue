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
        04 — Work
      </p>
      <div
        class="work-heading"
        data-aos="fade-up"
      >
        <h2 class="section-title">
          Professional work
        </h2>
        <p class="role-line">
          <span class="role-title">Software Engineer</span>
          <span aria-hidden="true">·</span>
          <span>Pearson</span>
          <span aria-hidden="true">·</span>
          <span>Sep 2022 – present</span>
          <span aria-hidden="true">·</span>
          <span>Remote</span>
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
            Main project
          </p>
          <h3 class="featured-title">
            TestNav
          </h3>
          <p class="featured-desc">
            Pearson's student testing app, delivering millions of secure, high-stakes school exams each year in every major browser and on Windows, macOS, Linux, iOS, and ChromeOS. I work across its full lifecycle, from new features to long-term maintenance, with a focus on reliability, security, and accessibility.
          </p>

          <ul class="featured-points">
            <li
              v-for="point in featured"
              :key="point"
              class="featured-point"
            >
              <svg
                viewBox="0 0 16 16"
                class="check-icon"
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

          <div class="stores">
            <span class="label stores-label">Available on</span>
            <a
              href="https://apps.apple.com/us/app/testnav/id818779127"
              target="_blank"
              rel="noreferrer"
              class="button-ghost store-btn"
            >
              <svg
                class="apple-icon"
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
              class="button-ghost store-btn"
            >
              <svg
                class="windows-icon"
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
          <p class="stats-note">
            Percentages are my own estimates.
          </p>
        </div>
      </article>

      <!-- Supporting work around the main project -->
      <p
        class="eyebrow-mini platform-label"
        data-aos="fade-up"
      >
        Around the platform
      </p>
      <div class="supporting-grid">
        <article
          v-for="(item, index) in supporting"
          :key="item.name"
          class="card spotlight supporting-card"
          data-aos="fade-up"
          :data-aos-delay="index * 60"
          @mousemove="trackPointer"
        >
          <h3 class="supporting-title">
            {{ item.name }}
          </h3>
          <p class="supporting-desc">
            {{ item.description }}
          </p>
          <p class="result">
            <span class="result-value">{{ item.result }}</span>
            <span class="result-label">{{ item.resultLabel }}</span>
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Work at Pearson, in order of emphasis: the TestNav client
// first (testing, then accessibility), supporting systems second. Describes what each system
// does, not what it's built on, so the section doesn't map out the employer's architecture.

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

// Feed the cursor position to the .spotlight glow
function trackPointer(e: MouseEvent) {
  const el   = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
  el.style.setProperty('--my', `${e.clientY - rect.top}px`)
}

// Scale comes first: it's the context that gives every other number its weight
const stats: Stat[] = [
  { value: 'Millions',    label: 'Of secure, high-stakes exams delivered each year' },
  { value: '~50%',        label: 'Faster development using AI assistance and custom skills' },
  { value: '~75%',        label: 'Fewer bugs after adding end-to-end testing' },
  { value: 'WCAG AA',     label: 'WCAG 2.1 AA accessibility compliance' },
]

const featured = [
  "Converted most of the client's views into reusable TypeScript components in React and Vue",
  'Introduced Playwright end-to-end testing to the codebase on my own initiative, then built an AI agent skill that lets coding agents run the app and check their changes',
  'Brought the client to WCAG 2.1 AA compliance with accessibility consultants, and built a reusable, cross-platform screen reader component that cut development time on accessibility features from 3+ days to 1',
  'Modernized a complex legacy feature to remove a deprecated core dependency, making it more feature-rich while keeping it backward compatible',
]

const supporting: Supporting[] = [
  {
    name: 'Native apps',
    description: 'The apps that host TestNav on desktop, iOS, and ChromeOS. I fix complex cross-platform defects.',
    result: '~50–75%',
    resultLabel: 'faster iOS development after I restored local debugging for my team',
  },
  {
    name: 'AI-powered services',
    description: 'I built an AI-powered feature end to end, plus support tools for the team.',
    result: 'Parallel agents',
    resultLabel: 'One support tool allows the team to run multiple AI coding agents on the same project simultaneously',
  },
  {
    name: 'Content repositories',
    description: 'The backend services that supply test content to the client and other platforms. Library updates, improvements, and API testing.',
    result: 'Zero',
    resultLabel: 'regressions across consuming platforms',
  },
  {
    name: 'Interactive content',
    description: 'Designed reusable test content templates to speed up development and QA.',
    result: '50–75%',
    resultLabel: 'less development time per item',
  },
]
</script>

<style scoped>
.work-heading {
  margin-top: 1.5rem;
  margin-bottom: 3.5rem;
}

.role-line {
  margin-top: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 1rem;
  font-family: var(--font-mono);
  font-size: 1.35rem;
  color: var(--color-ash);
}

.role-title {
  color: var(--color-snow);
  font-weight: 600;
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

.featured-title {
  margin-top: 0.75rem;
  font-size: var(--text-3xl);
  line-height: var(--leading-3xl);
  font-weight: 600;
  color: var(--color-snow);
}

@media (width < 480px) {
  .featured-title { font-size: var(--text-2xl); line-height: var(--leading-2xl); }
}

.featured-desc {
  margin-top: 1rem;
  font-size: var(--text-base);
  line-height: 1.75;
  color: var(--color-mist);
}

.featured-points {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.featured-point {
  display: flex;
  gap: 0.75rem;
  font-size: 1.45rem;
  line-height: 1.65;
  color: var(--color-mist);
}

.check-icon {
  flex-shrink: 0;
  width: 1.4rem;
  height: 1.4rem;
  margin-top: 0.4rem;
  color: var(--color-moss);
}

.stores {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 2.5rem;
}

.stores-label {
  margin-right: 0.5rem;
}

.store-btn {
  padding: 0.8rem 1.2rem;
  font-size: 1.35rem;
}

.apple-icon {
  width: 1.6rem;
  height: 1.6rem;
}

.windows-icon {
  width: 1.4rem;
  height: 1.4rem;
}

.stats-note {
  margin-top: 1rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-ash);
}

/* ── Supporting work ── */
.platform-label {
  margin-top: 4rem;
  margin-bottom: 1.5rem;
}

.supporting-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
}

@media (min-width: 640px) {
  .supporting-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (min-width: 1024px) {
  .supporting-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

.supporting-card {
  display: flex;
  flex-direction: column;
  padding: 2rem;
}

.supporting-title {
  font-size: var(--text-xl);
  line-height: var(--leading-xl);
  font-weight: 600;
  color: var(--color-snow);
}

.supporting-desc {
  margin-top: 0.75rem;
  margin-bottom: 1.5rem;
  font-size: 1.4rem;
  line-height: 1.65;
  color: var(--color-mist);
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
  margin-top: auto;
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
