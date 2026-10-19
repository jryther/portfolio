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
        class="mt-6 mb-14 flex flex-wrap items-end justify-between gap-8"
        data-aos="fade-up"
      >
        <div>
          <h2 class="section-title">
            Professional work
          </h2>
          <p class="text-body text-mist mt-4 max-w-[56rem]">
            Products I've helped build and maintain at Pearson Education — used by thousands of students on every major platform.
          </p>
        </div>

        <!-- Where TestNav ships -->
        <div class="flex flex-col gap-3">
          <p class="font-mono text-xs uppercase tracking-[0.12em] text-ash">
            TestNav ships on
          </p>
          <div class="flex flex-wrap gap-3">
            <a
              href="https://apps.apple.com/us/app/testnav/id818779127"
              target="_blank"
              rel="noreferrer"
              class="button-ghost text-[1.35rem] py-[0.9rem] px-[1.3rem]"
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
              class="button-ghost text-[1.35rem] py-[0.9rem] px-[1.3rem]"
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
          <p class="font-mono text-2xs text-ash">
            Windows · macOS · Linux · iOS · ChromeOS
          </p>
        </div>
      </div>

      <!-- Project cards — bento layout: 2-wide, 1-wide / 1-wide, 2-wide -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <article
          v-for="(project, index) in projects"
          :key="project.name"
          class="card spotlight p-10 flex flex-col max-xs:p-7"
          :class="{ 'lg:col-span-2': index === 0 || index === 3 }"
          data-aos="fade-up"
          :data-aos-delay="(index % 2) * 80"
          @mousemove="trackPointer"
        >
          <div class="flex items-start justify-between gap-6 mb-5">
            <h3 class="text-2xl font-semibold text-snow max-xs:text-xl">
              {{ project.name }}
            </h3>
            <span class="font-mono text-sm text-smoke">{{ String(index + 1).padStart(2, '0') }}</span>
          </div>

          <p class="text-base text-mist leading-[1.75] mb-6">
            {{ project.description }}
          </p>

          <ul class="mb-8 flex flex-col gap-3">
            <li
              v-for="achievement in project.achievements"
              :key="achievement"
              class="flex gap-3 text-[1.4rem] leading-[1.6] text-mist"
            >
              <svg
                viewBox="0 0 16 16"
                class="w-[1.4rem] h-[1.4rem] mt-[0.35rem] flex-shrink-0 text-moss"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              ><path d="m3 8.5 3 3 7-7" /></svg>
              {{ achievement }}
            </li>
          </ul>

          <ul class="mt-auto flex flex-wrap gap-2">
            <li
              v-for="tag in project.tags"
              :key="tag"
              class="chip"
            >
              {{ tag }}
            </li>
          </ul>
        </article>
      </div>

      <p
        class="text-base text-ash mt-12"
        data-aos="fade-up"
      >
        Personal projects and experiments live on
        <a
          href="https://github.com/jryther"
          target="_blank"
          rel="noreferrer"
          class="text-amber underline decoration-amber/40 underline-offset-4 hover:decoration-amber"
        >GitHub</a>.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Project {
  name: string
  description: string
  achievements: string[]
  tags: string[]
}

// Feed the cursor position to the .spotlight glow
function trackPointer(e: MouseEvent) {
  const el   = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
  el.style.setProperty('--my', `${e.clientY - rect.top}px`)
}

const projects: Project[] = [
  {
    name: 'Test Delivery Client Application',
    description: 'Student-facing web application delivering secure assessments to thousands of students. Contributed to modernizing the codebase, improving performance, and ensuring a reliable, accessible user experience.',
    achievements: [
      'Modernized a legacy jQuery codebase with React and TypeScript, improving performance and long-term maintainability',
      'Achieved full WCAG 2.1 AA accessibility compliance in collaboration with accessibility consultants',
      'Upheld security best practices to deliver a stable and trusted experience across diverse student populations',
    ],
    tags: ['React', 'TypeScript', 'JavaScript', 'jQuery', 'WCAG 2.1 AA'],
  },
  {
    name: 'Interactive Simulation Test Content',
    description: 'A reusable framework for interactive simulation experiences embedded within educational assessments, focused on portability, quality, and accessibility.',
    achievements: [
      'Architected a portable framework that significantly reduced production time for new interactive content',
      'Delivered accessible experiences used by thousands of students with full QA verification',
    ],
    tags: ['JavaScript', 'HTML', 'CSS', 'Accessibility'],
  },
  {
    name: 'Content Repository & Delivery API',
    description: 'A backend service delivering critical content across multiple consuming platforms, with a focus on stability, test coverage, and zero-regression library updates.',
    achievements: [
      'Managed critical library updates to improve reliability and performance',
      'Executed comprehensive API test suites ensuring zero regressions across dependent platforms',
    ],
    tags: ['API Testing', 'Library Updates'],
  },
  {
    name: 'Cross-Platform Desktop Application',
    description: 'Native desktop client software deployed across multiple operating systems. Responsibilities included defect investigation, release coordination, and platform-specific deployment support.',
    achievements: [
      'Investigated and remediated complex defects across Windows, macOS, Linux, iOS, and ChromeOS',
      'Managed parts of the release process, coordinating with third-party support and platform-specific portals',
      'Deployed updates across platforms, ensuring quality and consistency at each release',
    ],
    tags: ['iOS', 'Desktop', 'Cross-platform'],
  },
]
</script>
