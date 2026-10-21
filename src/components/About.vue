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
        01 — About
      </p>

      <div class="about-grid">
        <div data-aos="fade-up">
          <h2 class="section-title about-title">
            A little about me
          </h2>
          <p class="lede">
            I'm a full-stack software engineer who cares about getting the details right. I work mainly in JavaScript, TypeScript, HTML, and CSS, with Vue and React on the frontend and Java and Node.js on the backend. Before software, I spent nine years as a certified pharmacy technician, at a startup and at larger healthcare providers, where accuracy mattered on every task. That habit carries straight into how I build and test code.
          </p>
          <p class="lede">
            At Pearson, I work on TestNav, the testing app behind millions of secure, high-stakes school exams each year. I introduced end-to-end testing to its codebase, brought it to WCAG 2.1 AA compliance, and work across the apps and services that support it. I lean on AI coding agents and automated tests to move quickly without letting quality slip, and I mentor teammates through code reviews and secure design.
          </p>
        </div>

        <div
          class="card glance-card"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <p class="label card-label">
            At a glance
          </p>
          <dl class="facts">
            <div
              v-for="fact in facts"
              :key="fact.label"
              class="fact"
            >
              <dt>
                {{ fact.label }}
              </dt>
              <dd>
                {{ fact.value }}
              </dd>
            </div>
          </dl>
          <div class="downloads">
            <a
              :href="resumeUrl"
              class="button-ghost download-btn"
              download="Joshua_Ryther_Resume.pdf"
            >
              <svg
                v-bind="downloadIcon"
                aria-hidden="true"
              ><path d="M8 2v8m0 0L4.5 6.5M8 10l3.5-3.5M2.5 13.5h11" /></svg>
              Resume
            </a>
            <a
              :href="coverLetterUrl"
              class="button-ghost download-btn"
              download="Joshua_Ryther_Cover_Letter.docx"
            >
              <svg
                v-bind="downloadIcon"
                aria-hidden="true"
              ><path d="M8 2v8m0 0L4.5 6.5M8 10l3.5-3.5M2.5 13.5h11" /></svg>
              Cover letter
            </a>
          </div>
        </div>
      </div>

      <!-- ── Experience & education timeline ── -->
      <div class="subsection">
        <p
          class="eyebrow"
          data-aos="fade-up"
        >
          02 — Experience
        </p>
        <h2
          class="section-title subsection-title"
          data-aos="fade-up"
        >
          Experience &amp; education
        </h2>

        <ol class="timeline">
          <li
            v-for="item in timeline"
            :key="item.title + item.org"
            class="timeline-item"
            data-aos="fade-up"
          >
            <p class="timeline-date">
              {{ item.dates }}
            </p>
            <div class="timeline-body">
              <span
                class="timeline-dot"
                :class="{ work: item.type === 'Work' }"
                aria-hidden="true"
              />
              <p class="label is-small timeline-type">
                {{ item.type }}
              </p>
              <h3 class="timeline-title">
                {{ item.title }}
              </h3>
              <p class="timeline-org-line">
                <span class="timeline-org">{{ item.org }}</span>
                <span v-if="item.meta"> · {{ item.meta }}</span>
              </p>
              <ul
                v-if="item.bullets"
                class="timeline-bullets"
              >
                <li
                  v-for="bullet in item.bullets"
                  :key="bullet"
                  class="timeline-bullet"
                >
                  {{ bullet }}
                </li>
              </ul>
            </div>
          </li>
        </ol>
      </div>

      <!-- ── Skills ── -->
      <div class="subsection">
        <p
          class="eyebrow"
          data-aos="fade-up"
        >
          03 — Skills
        </p>
        <h2
          class="section-title subsection-title"
          data-aos="fade-up"
        >
          Tools I build with
        </h2>

        <div class="skill-groups">
          <div
            v-for="(group, index) in skillGroups"
            :key="group.name"
            class="card skill-group"
            data-aos="fade-up"
            :data-aos-delay="index * 80"
          >
            <p class="label card-label">
              {{ group.name }}
            </p>
            <ul class="skill-list">
              <li
                v-for="skill in group.skills"
                :key="skill.name"
                class="skill-chip chip"
              >
                <img
                  :src="skill.svg"
                  alt=""
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
  name: string
  skills: Skill[]
}

interface TimelineItem {
  type: 'Work' | 'Education'
  dates: string
  title: string
  org: string
  meta?: string
  bullets?: string[]
}

// Whole years since starting at Pearson in September 2022, so this never goes stale
const yearsInSoftware = Math.floor((Date.now() - Date.UTC(2022, 8, 1)) / (365.25 * 24 * 60 * 60 * 1000))

const facts = [
  { label: 'Based in',   value: 'Salem, Oregon' },
  { label: 'Currently',  value: 'Software Engineer at Pearson' },
  { label: 'Experience', value: `${yearsInSoftware}+ years in software engineering` },
  { label: 'Focus',      value: 'Full-stack web, testing, accessibility' },
  { label: 'Education',  value: 'B.S. Computer Science, SNHU' },
]

const downloadIcon = {
  viewBox: '0 0 16 16',
  class: 'download-icon',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.6',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
} as const

const timeline: TimelineItem[] = [
  {
    type: 'Work',
    dates: 'Sep 2022 — Present',
    title: 'Software Engineer',
    org: 'Pearson Education',
    meta: 'Remote',
    bullets: [
      "Converted most of the client's views from legacy JavaScript into reusable TypeScript components in React and Vue",
      'Introduced end-to-end testing to the TestNav client, contributing to about 75% fewer bugs, and sped up development by about 50% using AI assistance and custom skills, including an AI agent skill',
      'Brought TestNav to WCAG 2.1 AA compliance with accessibility consultants, and built a reusable screen reader component that cut development time on accessibility features from 3+ days to 1',
      'Built AI-powered services end to end, including a backend feature with TypeScript, ESLint, and unit tests, and a support tool that allows the team to run multiple AI coding agents on the same project simultaneously',
      'Architected reusable content templates that cut development time per test item by 50–75%',
      'Raised code quality and security through code reviews and by teaching teammates secure design',
    ],
  },
  {
    type: 'Education',
    dates: '2020 — 2022',
    title: 'B.S. Computer Science',
    org: 'Southern New Hampshire University',
  },
  {
    type: 'Work',
    dates: 'Jun 2013 — Sep 2022',
    title: 'Certified Pharmacy Technician',
    org: 'Ro, Providence Health Plan, Walgreens',
    meta: 'Beaverton, OR',
    bullets: [
      'Handled accuracy-critical work in team-based environments, including precise prescription data entry and rule-based prior authorizations',
      'Managed inventory and supply chains to keep operations running under high-stress, time-sensitive conditions',
    ],
  },
  {
    type: 'Education',
    dates: '2009 — 2014',
    title: 'B.S. Economics',
    org: 'University of Oregon',
    meta: 'Minor: Business Administration',
  },
]

const skillGroups: SkillGroup[] = [
  {
    name: 'Frontend',
    skills: [
      { name: 'Vue.js',       svg: vueSvg },
      { name: 'React',        svg: reactSvg },
      { name: 'TypeScript',   svg: tsSvg },
      { name: 'JavaScript',   svg: jsSvg },
      { name: 'Tailwind CSS', svg: tailwindSvg },
    ],
  },
  {
    name: 'Backend & Data',
    skills: [
      { name: 'Node.js', svg: nodeSvg },
      { name: 'Java',    svg: javaSvg },
      { name: 'MySQL',   svg: mysqlSvg },
      { name: 'MongoDB', svg: mongoSvg },
    ],
  },
  {
    name: 'Testing & DevOps',
    skills: [
      { name: 'Jest',    svg: jestSvg },
      { name: 'Jenkins', svg: jenkinsSvg },
      { name: 'AWS',     svg: awsSvg },
    ],
  },
]
</script>

<style scoped>
/* ── About — bio beside an "at a glance" card ── */
.about-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 4rem;
  margin-top: 1.5rem;
}

@media (min-width: 1024px) {
  .about-grid {
    grid-template-columns: 1.6fr 1fr;
    gap: 5rem;
  }
}

.about-title {
  margin-bottom: 2rem;
}

.lede + .lede {
  margin-top: 1.5rem;
}

.glance-card {
  align-self: flex-start;
  padding: 2rem;
}

.card-label {
  margin-bottom: 1.5rem;
}

.facts {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.fact {
  display: grid;
  grid-template-columns: 9rem 1fr;
  gap: 1rem;
  font-size: var(--text-base);
  line-height: var(--leading-base);
}
.fact dt { color: var(--color-ash); }
.fact dd { color: var(--color-snow); }

.downloads {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-line);
}

.download-btn {
  padding: 1rem 1.4rem;
  font-size: 1.4rem;
}

.download-icon {
  width: 1.4rem;
  height: 1.4rem;
}

/* ── Experience and skills ── */
.subsection {
  margin-top: 8rem;
}

.subsection-title {
  margin-top: 1.5rem;
  margin-bottom: 3.5rem;
}

@media (width < 768px) {
  .subsection { margin-top: 6rem; }
}

.timeline-type {
  margin-bottom: 0.5rem;
}

.timeline-title {
  font-size: var(--text-xl);
  line-height: var(--leading-xl);
  font-weight: 600;
  color: var(--color-snow);
}

.timeline-org-line {
  margin-top: 0.25rem;
  font-size: var(--text-base);
  line-height: var(--leading-base);
  color: var(--color-mist);
}

.timeline-org {
  color: var(--color-amber);
}

.timeline-bullets {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.timeline-bullet {
  position: relative;
  padding-left: 1.5rem;
  font-size: var(--text-base);
  line-height: 1.7;
  color: var(--color-mist);
}

/* Short dash marker */
.timeline-bullet::before {
  content: '';
  position: absolute;
  left: 0;
  top: 1.25rem;
  width: 0.6rem;
  height: 1px;
  background-color: var(--color-ash);
}

.skill-groups {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .skill-groups { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

.skill-group {
  padding: 2rem;
}

.skill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

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
  padding: 0.7rem 1.2rem;
  font-size: 1.3rem;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.skill-chip img {
  width: 1.8rem;
  height: 1.8rem;
  object-fit: contain;
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
