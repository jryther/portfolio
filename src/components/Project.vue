<template>
  <section
    id="projects"
    class="py-32 px-[5%] bg-[linear-gradient(135deg,_rgba(45,80,22,0.08)_0%,_rgba(15,20,25,0.9)_100%)] max-md:py-16 max-md:px-8 max-xs:py-8 max-xs:px-4"
  >
    <h2
      class="text-3xl mb-12 text-snow text-center max-md:text-2xl max-md:mb-8 max-xs:text-xl"
      data-aos="fade-in-up"
    >
      Professional Work
    </h2>

    <!-- App Store links -->
    <div
      class="flex flex-col items-center gap-[1.2rem] my-4 mb-8"
      data-aos="fade-in-up"
      data-aos-delay="100"
    >
      <p class="text-base text-ash m-0 tracking-[0.05em] uppercase">
        TestNav is available on
      </p>
      <div class="flex flex-wrap gap-[1.2rem] justify-center">
        <a
          href="https://apps.apple.com/us/app/testnav/id818779127"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center gap-4 py-[0.9rem] px-[1.8rem] bg-white/[.04] border border-amber/45 rounded-[0.8rem] text-amber no-underline transition-[background,border-color,transform] duration-[250ms] hover:bg-amber/10 hover:border-amber hover:-translate-y-[2px]"
        >
          <svg
            class="w-[2.4rem] h-[2.4rem] flex-shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <span class="flex flex-col leading-[1.2]">
            <span class="text-xs text-ash uppercase tracking-[0.04em]">Download on the</span>
            <span class="text-[1.5rem] font-semibold text-amber">App Store</span>
          </span>
        </a>
        <a
          href="https://apps.microsoft.com/detail/9nd5fc7rppx1?hl=en-US&gl=US"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center gap-4 py-[0.9rem] px-[1.8rem] bg-white/[.04] border border-amber/45 rounded-[0.8rem] text-amber no-underline transition-[background,border-color,transform] duration-[250ms] hover:bg-amber/10 hover:border-amber hover:-translate-y-[2px]"
        >
          <svg
            class="w-[2.4rem] h-[2.4rem] flex-shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
          </svg>
          <span class="flex flex-col leading-[1.2]">
            <span class="text-xs text-ash uppercase tracking-[0.04em]">Get it on</span>
            <span class="text-[1.5rem] font-semibold text-amber">Microsoft Store</span>
          </span>
        </a>
      </div>
    </div>

    <!-- Project cards -->
    <div class="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8 mb-12 max-md:grid-cols-1 max-md:gap-6">
      <div
        v-for="(project, index) in projects"
        :key="project.name"
        class="bg-white/5 border border-forest/40 rounded-2xl p-8 flex flex-col max-xs:p-6"
        :data-aos="'fade-in-up'"
        :data-aos-delay="(index * 200)"
      >
        <div class="mb-4">
          <h3 class="text-lg text-snow m-0 max-xs:text-body">
            {{ project.name }}
          </h3>
        </div>

        <p class="text-base text-[#ccc] mb-6 flex-grow leading-relaxed">
          {{ project.description }}
        </p>

        <div
          v-if="project.achievements"
          class="mb-6 flex-grow"
        >
          <ul>
            <li
              v-for="achievement in project.achievements"
              :key="achievement"
              class="text-sm text-ash mb-[0.7rem] pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-amber before:font-bold"
            >
              {{ achievement }}
            </li>
          </ul>
        </div>

        <div class="flex gap-4 mt-auto">
          <a
            v-if="project.link !== '#'"
            :href="project.link"
            target="_blank"
            rel="noreferrer"
            class="flex-1 p-4 text-center rounded-lg font-medium transition-all duration-300 bg-forest text-snow border-none hover:brightness-125 hover:bg-moss"
          >
            View Project →
          </a>
          <a
            v-if="project.github !== '#'"
            :href="project.github"
            target="_blank"
            rel="noreferrer"
            class="flex-1 p-4 text-center rounded-lg font-medium transition-all duration-300 bg-transparent text-amber border-2 border-amber hover:bg-amber hover:text-charcoal"
          >
            GitHub 💻
          </a>
        </div>
      </div>
    </div>

    <p
      class="text-body text-ash text-center mt-12"
      data-aos="fade-in-up"
      data-aos-delay="600"
    >
      Explore more projects on my <a
        href="https://github.com/jryther"
        target="_blank"
        class="text-amber hover:underline"
      >GitHub</a>
    </p>
  </section>
</template>

<script setup lang="ts">
interface Project {
  name: string
  description: string
  achievements: string[]
  link: string
  github: string
}

const projects: Project[] = [
  {
    name: 'Test Delivery Client Application',
    description: 'Student-facing web application delivering secure assessments to thousands of students. Contributed to modernizing the codebase, improving performance, and ensuring a reliable, accessible user experience.',
    achievements: [
      'Modernized a legacy codebase improving performance and long-term maintainability',
      'Achieved full WCAG 2.1 AA accessibility compliance in collaboration with accessibility consultants',
      'Participated in the full development lifecycle from feature implementation through long-term maintenance',
      'Upheld security best practices to deliver a stable and trusted experience across diverse student populations'
    ],
    link: '#',
    github: '#'
  },
  {
    name: 'Interactive Simulation Test Content',
    description: 'Designed and built a reusable framework for interactive simulation experiences embedded within educational assessments. Focused on portability, quality, and accessibility across a broad student audience.',
    achievements: [
      'Architected a portable, reusable framework that significantly reduced production time for new interactive content',
      'Delivered accessible, interactive experiences used by thousands of students with full QA verification',
      'Collaborated across design and QA teams to maintain technical excellence and educational quality',
      'Applied accessibility best practices to enable broader and more equitable student engagement'
    ],
    link: '#',
    github: '#'
  },
  {
    name: 'Content Repository & Delivery API',
    description: 'Maintained and enhanced a backend service responsible for delivering critical content across multiple consuming platforms. Focused on stability, test coverage, and zero-regression library updates.',
    achievements: [
      'Maintained and enhanced a critical backend service while managing library updates to improve reliability',
      'Executed comprehensive API test suites ensuring zero regressions across all dependent platforms',
      'Coordinated with product teams to balance ongoing maintenance with feature development priorities',
      'Improved service reliability and performance through systematic testing and incremental updates'
    ],
    link: '#',
    github: '#'
  },
  {
    name: 'Cross-Platform Desktop Application',
    description: 'Contributed to native desktop client software deployed across multiple operating systems and platforms. Responsibilities included defect investigation, release coordination, and platform-specific deployment support.',
    achievements: [
      'Investigated and remediated complex defects across Windows, macOS, Linux, iOS, and ChromeOS',
      'Managed aspects of the release process, coordinating with third-party support and platform-specific portals',
      'Deployed updates across multiple platforms ensuring quality and consistency at each release',
      'Supported testing and final release cycles with attention to platform-specific requirements'
    ],
    link: '#',
    github: '#'
  },
]
</script>
