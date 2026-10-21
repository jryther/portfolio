<template>
  <section
    id="about"
    class="section bg-topo"
  >
    <div class="wrap">
      <!-- ── About ── -->
      <p
        class="eyebrow"
        data-aos="fade-up"
      >
        {{ t('about.eyebrow') }}
      </p>

      <div class="mt-6 grid grid-cols-1 gap-16 lg:grid-cols-[1.6fr_1fr] lg:gap-20">
        <div data-aos="fade-up">
          <h2 class="section-title mb-8">
            {{ t('about.title') }}
          </h2>
          <p class="text-body leading-[1.8] text-mist mb-6">
            {{ t('about.bio1') }}
          </p>
          <p class="text-body leading-[1.8] text-mist">
            {{ t('about.bio2') }}
          </p>
        </div>

        <div
          class="card p-8 self-start"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <p class="font-mono text-xs uppercase tracking-[0.12em] text-ash mb-6">
            {{ t('about.atAGlance') }}
          </p>
          <dl class="flex flex-col gap-5">
            <div
              v-for="fact in facts"
              :key="fact.label"
              class="grid grid-cols-[9rem_1fr] gap-4 text-base"
            >
              <dt class="text-ash">
                {{ fact.label }}
              </dt>
              <dd class="text-snow">
                {{ fact.value }}
              </dd>
            </div>
          </dl>
          <div class="mt-8 pt-8 border-t border-line flex flex-wrap gap-3">
            <a
              :href="resumeUrl"
              class="button-ghost text-[1.4rem] py-[1rem] px-[1.4rem]"
              download="Joshua_Ryther_Resume.pdf"
            >
              <svg
                v-bind="downloadIcon"
                aria-hidden="true"
              ><path d="M8 2v8m0 0L4.5 6.5M8 10l3.5-3.5M2.5 13.5h11" /></svg>
              {{ t('about.resume') }}
            </a>
            <a
              :href="coverLetterUrl"
              class="button-ghost text-[1.4rem] py-[1rem] px-[1.4rem]"
              download="Joshua_Ryther_Cover_Letter.docx"
            >
              <svg
                v-bind="downloadIcon"
                aria-hidden="true"
              ><path d="M8 2v8m0 0L4.5 6.5M8 10l3.5-3.5M2.5 13.5h11" /></svg>
              {{ t('about.coverLetter') }}
            </a>
          </div>
        </div>
      </div>

      <!-- ── Experience & education timeline ── -->
      <div class="mt-32 max-md:mt-24">
        <p
          class="eyebrow"
          data-aos="fade-up"
        >
          {{ t('about.experienceEyebrow') }}
        </p>
        <h2
          class="section-title mt-6 mb-14"
          data-aos="fade-up"
        >
          {{ t('about.experienceTitle') }}
        </h2>

        <ol class="timeline">
          <li
            v-for="item in timeline"
            :key="item.key"
            class="timeline-item"
            data-aos="fade-up"
          >
            <p class="timeline-date">
              {{ item.dates }}
            </p>
            <div class="timeline-body">
              <span
                class="timeline-dot"
                :class="{ work: item.type === 'work' }"
                aria-hidden="true"
              />
              <p class="font-mono text-2xs uppercase tracking-[0.12em] text-ash mb-2">
                {{ t(`about.type.${item.type}`) }}
              </p>
              <h3 class="text-xl font-semibold text-snow">
                {{ item.title }}
              </h3>
              <p class="text-base text-mist mt-1">
                <span class="text-amber">{{ item.org }}</span>
                <span v-if="item.meta"> · {{ item.meta }}</span>
              </p>
              <ul
                v-if="item.bullets.length"
                class="mt-5 flex flex-col gap-3"
              >
                <li
                  v-for="bullet in item.bullets"
                  :key="bullet"
                  class="relative pl-6 text-base leading-[1.7] text-mist before:content-[''] before:absolute before:left-0 before:top-[1.25rem] before:w-[0.6rem] before:h-px before:bg-ash"
                >
                  {{ bullet }}
                </li>
              </ul>
            </div>
          </li>
        </ol>
      </div>

      <!-- ── Skills ── -->
      <div class="mt-32 max-md:mt-24">
        <p
          class="eyebrow"
          data-aos="fade-up"
        >
          {{ t('about.skillsEyebrow') }}
        </p>
        <h2
          class="section-title mt-6 mb-14"
          data-aos="fade-up"
        >
          {{ t('about.skillsTitle') }}
        </h2>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div
            v-for="(group, index) in skillGroups"
            :key="group.key"
            class="card p-8"
            data-aos="fade-up"
            :data-aos-delay="index * 80"
          >
            <p class="font-mono text-xs uppercase tracking-[0.12em] text-ash mb-6">
              {{ t(`about.skillGroups.${group.key}`) }}
            </p>
            <ul class="flex flex-wrap gap-3">
              <li
                v-for="skill in group.skills"
                :key="skill.name"
                class="skill-chip chip text-[1.3rem] py-[0.7rem] px-[1.2rem]"
              >
                <img
                  :src="skill.svg"
                  alt=""
                  class="w-[1.8rem] h-[1.8rem] object-contain"
                >
                {{ skill.name }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { messageList } from '../i18n'
import reactSvg       from '../assets/techIcons/react.svg'
import vueSvg         from '../assets/techIcons/vuejs.svg'
import tsSvg          from '../assets/techIcons/typescript.svg'
import jsSvg          from '../assets/techIcons/js.svg'
import nodeSvg        from '../assets/techIcons/nodejs.svg'
import javaSvg        from '../assets/techIcons/java.svg'
import mysqlSvg       from '../assets/techIcons/mysql.svg'
import mongoSvg       from '../assets/techIcons/mongodb.svg'
import jestSvg        from '../assets/techIcons/jest.svg'
import jenkinsSvg     from '../assets/techIcons/jenkins.svg'
import awsSvg         from '../assets/techIcons/aws.svg'
import tailwindSvg    from '../assets/techIcons/tailwindcss.svg'
import resumeUrl      from '../assets/Resume.pdf'
import coverLetterUrl from '../assets/Cover Letter.docx'

interface Skill {
  name: string
  svg: string
}

interface SkillGroup {
  /** about.skillGroups.<key> in the locale files */
  key: string
  skills: Skill[]
}

interface TimelineEntry {
  /** about.timeline.<key> in the locale files holds its dates, title, meta and bullets */
  key: string
  type: 'work' | 'education'
  org: string
}

const { t, te } = useI18n()

// Whole years since starting at Pearson in September 2022, so this never goes stale
const yearsInSoftware = Math.floor((Date.now() - Date.UTC(2022, 8, 1)) / (365.25 * 24 * 60 * 60 * 1000))

const facts = computed(() => [
  { label: t('about.facts.basedIn'),    value: t('about.facts.basedInValue') },
  { label: t('about.facts.currently'),  value: t('about.facts.currentlyValue') },
  { label: t('about.facts.experience'), value: t('about.facts.experienceValue', { years: yearsInSoftware }) },
  { label: t('about.facts.focus'),      value: t('about.facts.focusValue') },
  { label: t('about.facts.education'),  value: t('about.facts.educationValue') },
])

const downloadIcon = {
  viewBox: '0 0 16 16',
  class: 'w-[1.4rem] h-[1.4rem]',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.6',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
} as const

const entries: TimelineEntry[] = [
  { key: 'pearson',  type: 'work',      org: 'Pearson Education' },
  { key: 'snhu',     type: 'education', org: 'Southern New Hampshire University' },
  { key: 'pharmacy', type: 'work',      org: 'Ro, Providence Health Plan, Walgreens' },
  { key: 'uo',       type: 'education', org: 'University of Oregon' },
]

// Each entry with its text in the current language; meta and bullets are optional
const timeline = computed(() => entries.map((entry) => {
  const base = `about.timeline.${entry.key}`
  return {
    ...entry,
    dates: t(`${base}.dates`),
    title: t(`${base}.title`),
    meta: te(`${base}.meta`) ? t(`${base}.meta`) : undefined,
    bullets: messageList(`${base}.bullets`),
  }
}))

const skillGroups: SkillGroup[] = [
  {
    key: 'frontend',
    skills: [
      { name: 'Vue.js',       svg: vueSvg },
      { name: 'React',        svg: reactSvg },
      { name: 'TypeScript',   svg: tsSvg },
      { name: 'JavaScript',   svg: jsSvg },
      { name: 'Tailwind CSS', svg: tailwindSvg },
    ],
  },
  {
    key: 'backend',
    skills: [
      { name: 'Node.js', svg: nodeSvg },
      { name: 'Java',    svg: javaSvg },
      { name: 'MySQL',   svg: mysqlSvg },
      { name: 'MongoDB', svg: mongoSvg },
    ],
  },
  {
    key: 'devops',
    skills: [
      { name: 'Jest',    svg: jestSvg },
      { name: 'Jenkins', svg: jenkinsSvg },
      { name: 'AWS',     svg: awsSvg },
    ],
  },
]
</script>

<style scoped>
/* ── Timeline — date column + hairline rail with dots ── */
.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: grid;
  grid-template-columns: 18rem 1fr;
  gap: 4rem;
}

.timeline-date {
  padding-top: 0.3rem;
  font-family: var(--font-mono);
  font-size: 1.3rem;
  color: var(--color-ash);
  text-align: right;
}

.timeline-body {
  position: relative;
  padding: 0 0 5.6rem 3.6rem;
  border-left: 1px solid var(--color-line-strong);
}

.timeline-item:last-child .timeline-body {
  padding-bottom: 0;
  border-left-color: transparent;
}

.timeline-dot {
  position: absolute;
  top: 0.5rem;
  left: -0.6rem;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background: var(--color-charcoal);
  border: 2px solid var(--color-ash);
}

.timeline-dot.work {
  border-color: var(--color-amber);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-amber) 14%, transparent);
}

@media (max-width: 768px) {
  .timeline-item {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .timeline-date {
    padding: 0 0 1rem 3.6rem;
    border-left: 1px solid var(--color-line-strong);
    text-align: left;
  }

  .timeline-body { padding-bottom: 4.8rem; }

  .timeline-dot { top: -2.6rem; }
}

/* Monochrome icons that pick up their brand colour on hover */
.skill-chip {
  transition: border-color 0.2s ease, color 0.2s ease;
}

.skill-chip img {
  filter: saturate(0.2);
  opacity: 0.75;
  transition: filter 0.2s ease, opacity 0.2s ease;
}

.skill-chip:hover {
  border-color: var(--color-line-strong);
  color: var(--color-snow);
}

.skill-chip:hover img {
  filter: none;
  opacity: 1;
}
</style>
