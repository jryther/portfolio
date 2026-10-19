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

      <div class="mt-6 grid grid-cols-1 gap-16 lg:grid-cols-[1.6fr_1fr] lg:gap-20">
        <div data-aos="fade-up">
          <h2 class="section-title mb-8">
            A little about me
          </h2>
          <p class="text-body leading-[1.8] text-mist mb-6">
            I'm a full-stack software engineer with a unique foundation in precision-driven environments and a passion for building robust, high-quality software. My background combines rigorous attention to detail with technical expertise in React, Vue, Node.js, and TypeScript, enabling me to architect scalable solutions and deliver measurable impact.
          </p>
          <p class="text-body leading-[1.8] text-mist">
            At Pearson Education, I've contributed to a diverse product ecosystem spanning web applications, content management systems, and cross-platform desktop clients. My approach emphasizes modernizing legacy systems, implementing accessibility standards, and maintaining code quality through comprehensive testing and security-focused design. Whether optimizing performance, championing WCAG compliance, or mentoring teammates, I'm committed to building software that users can trust.
          </p>
        </div>

        <aside
          class="card p-8 self-start"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <p class="font-mono text-xs uppercase tracking-[0.12em] text-ash mb-6">
            At a glance
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
              Resume
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
              Cover letter
            </a>
          </div>
        </aside>
      </div>

      <!-- ── Experience & education timeline ── -->
      <div class="mt-32 max-md:mt-24">
        <p
          class="eyebrow"
          data-aos="fade-up"
        >
          02 — Experience
        </p>
        <h2
          class="section-title mt-6 mb-14"
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
              <p class="font-mono text-2xs uppercase tracking-[0.12em] text-ash mb-2">
                {{ item.type }}
              </p>
              <h3 class="text-xl font-semibold text-snow">
                {{ item.title }}
              </h3>
              <p class="text-base text-mist mt-1">
                <span class="text-amber">{{ item.org }}</span>
                <span v-if="item.meta"> · {{ item.meta }}</span>
              </p>
              <ul
                v-if="item.bullets"
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
          03 — Skills
        </p>
        <h2
          class="section-title mt-6 mb-14"
          data-aos="fade-up"
        >
          Tools I build with
        </h2>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div
            v-for="(group, index) in skillGroups"
            :key="group.name"
            class="card p-8"
            data-aos="fade-up"
            :data-aos-delay="index * 80"
          >
            <p class="font-mono text-xs uppercase tracking-[0.12em] text-ash mb-6">
              {{ group.name }}
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

const facts = [
  { label: 'Based in',  value: 'Portland, Oregon' },
  { label: 'Currently', value: 'Software Engineer at Pearson' },
  { label: 'Focus',     value: 'Accessibility, legacy modernization, testing' },
  { label: 'Education', value: 'B.S. Computer Science, SNHU' },
]

const downloadIcon = {
  viewBox: '0 0 16 16',
  class: 'w-[1.4rem] h-[1.4rem]',
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
      'Engineered full-stack features across student-facing testing applications, content repositories, and cross-platform native applications',
      'Modernized legacy codebase by integrating React and TypeScript, improving performance and maintainability',
      'Championed accessibility with consultants to achieve WCAG 2.1 AA compliance for thousands of students',
      'Architected reusable simulation framework reducing production time for new interactive test content',
      'Executed comprehensive API testing ensuring zero regressions across consuming platforms',
      'Contributed to code quality and security through peer reviews and team education',
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
      'Executed zero-error-tolerance workflows in team-based environments, including precise prescription data entry and rule-based prior authorizations',
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
      { name: 'React',        svg: reactSvg },
      { name: 'Vue.js',       svg: vueSvg },
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
