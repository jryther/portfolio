<template>
  <section
    id="about"
    class="py-32 px-[5%] grid grid-cols-1 gap-16 overflow-x-hidden max-md:py-16 max-md:px-8 max-xs:py-8 max-xs:px-4"
  >
    <div class="min-w-0 w-full">
      <h2
        class="text-3xl mb-8 text-snow max-md:text-2xl max-xs:text-xl"
        data-aos="fade-in-left"
      >
        About Me
      </h2>

      <p
        class="text-body leading-[1.8] text-mist mb-4"
        data-aos="fade-in-left"
        data-aos-delay="100"
      >
        I'm a full-stack software engineer with a unique foundation in precision-driven environments and a passion for building robust, high-quality software. My background combines rigorous attention to detail with technical expertise in React, Vue, Node.js, and TypeScript, enabling me to architect scalable solutions and deliver measurable impact.
      </p>
      <p
        class="text-body leading-[1.8] text-mist mb-4"
        data-aos="fade-in-left"
        data-aos-delay="200"
      >
        At Pearson Education, I've contributed to a diverse product ecosystem spanning web applications, content management systems, and cross-platform desktop clients. My approach emphasizes modernizing legacy systems, implementing accessibility standards, and maintaining code quality through comprehensive testing and security-focused design. Whether optimizing performance, championing WCAG compliance, or mentoring teammates, I'm committed to building software that users can trust.
      </p>

      <!-- Education -->
      <div
        class="my-8 p-6 bg-forest/[.12] border-l-4 border-amber rounded-lg"
        data-aos="fade-in-left"
        data-aos-delay="300"
      >
        <h3 class="text-xl mt-0 mb-4 text-amber">
          Education
        </h3>
        <h4 class="text-lg mt-4 mb-2 text-snow">
          Bachelor of Science - Computer Science
        </h4>
        <p class="text-base text-ash">
          Southern New Hampshire University | 2020 - 2022
        </p>
        <h4 class="text-lg mt-4 mb-2 text-snow">
          Bachelor of Science - Economics
        </h4>
        <p class="text-base text-ash">
          University of Oregon | 2009 - 2014 (Minor: Business Administration)
        </p>
      </div>

      <!-- Experience -->
      <div
        class="my-8 p-6 bg-forest/[.12] border-l-4 border-amber rounded-lg"
        data-aos="fade-in-left"
        data-aos-delay="400"
      >
        <h3 class="text-xl mt-0 mb-4 text-amber">
          Professional Experience
        </h3>
        <h4 class="text-lg mt-4 mb-2 text-snow">
          Software Engineer
        </h4>
        <p class="text-base text-ash">
          <strong>Pearson Education | Remote</strong>
        </p>
        <p class="text-sm text-ash mt-2">
          September 2022 - Present
        </p>
        <p class="text-sm text-ash mt-2 leading-[1.8]">
          • Engineered full-stack features across student-facing testing applications, content repositories, and cross-platform native applications<br>
          • Modernized legacy codebase by integrating React and TypeScript, improving performance and maintainability<br>
          • Championed accessibility with consultants to achieve WCAG 2.1 AA compliance for thousands of students<br>
          • Architected reusable simulation framework reducing production time for new interactive test content<br>
          • Executed comprehensive API testing ensuring zero regressions across consuming platforms<br>
          • Contributed to code quality and security through peer reviews and team education
        </p>
      </div>

      <!-- Skills carousel -->
      <h3
        class="text-xl mt-8 mb-4 text-amber"
        data-aos="fade-in-left"
        data-aos-delay="500"
      >
        Technical Skills
      </h3>

      <div
        class="skills-carousel"
        data-aos="fade-in-up"
        data-aos-delay="600"
      >
        <div class="skills-track flex gap-6 w-max">
          <div
            v-for="(skill, index) in [...skills, ...skills]"
            :key="index + '-' + skill.name"
            class="flex flex-col items-center gap-2 py-8 px-[1.6rem] min-w-[110px] bg-forest/[.15] border border-forest/30 rounded-2xl flex-shrink-0 max-md:py-6 max-md:px-[1.2rem] max-md:min-w-[90px] max-xs:min-w-[80px] max-xs:py-[1.2rem] max-xs:px-4"
            :title="skill.name"
          >
            <img
              v-if="skill.svg"
              :src="skill.svg"
              :alt="skill.name"
              class="w-[3.2rem] h-[3.2rem] object-contain"
            >
            <span
              v-else
              class="text-[3rem] leading-none"
            >{{ skill.icon }}</span>
            <p class="text-sm text-center m-0 whitespace-nowrap max-md:text-xs max-xs:text-2xs">
              {{ skill.name }}
            </p>
          </div>
        </div>
      </div>

      <!-- Documents -->
      <div
        class="mt-0 pt-2"
        data-aos="fade-in-left"
        data-aos-delay="800"
      >
        <h3 class="text-xl mt-8 mb-6 text-amber">
          Documents
        </h3>
        <div class="flex flex-wrap gap-4">
          <a
            :href="resumeUrl"
            class="button"
            download="Joshua_Ryther_Resume.pdf"
          >Download Resume</a>
          <a
            :href="coverLetterUrl"
            class="button"
            download="Joshua_Ryther_Cover_Letter.docx"
          >Download Cover Letter</a>
        </div>
        <p class="mt-4 text-sm text-ash">
          For detailed information about my qualifications and projects
        </p>
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
import awsSvg         from '../assets/techIcons/aws.svg'
import tailwindSvg    from '../assets/techIcons/tailwindcss.svg'
import resumeUrl      from '../assets/Resume.pdf'
import coverLetterUrl from '../assets/Cover Letter.docx'

interface Skill {
  name: string
  svg: string | null
  icon?: string
}

const skills: Skill[] = [
  { name: 'React',        svg: reactSvg },
  { name: 'Vue.js',       svg: vueSvg },
  { name: 'TypeScript',   svg: tsSvg },
  { name: 'JavaScript',   svg: jsSvg },
  { name: 'Node.js',      svg: nodeSvg },
  { name: 'Java',         svg: javaSvg },
  { name: 'MySQL',        svg: mysqlSvg },
  { name: 'MongoDB',      svg: mongoSvg },
  { name: 'Jest',         svg: jestSvg },
  { name: 'AWS',          svg: awsSvg },
  { name: 'Jenkins',      svg: null, icon: '⚙️' },
  { name: 'Tailwind CSS', svg: tailwindSvg },
]
</script>

<style scoped>
/* ── Skills Carousel — animation & mask can't be expressed as Tailwind utilities ── */
.skills-carousel {
  position: relative;
  overflow-x: hidden;
  overflow-y: visible;
  width: 100%;
  box-sizing: border-box;
  margin-top: 2rem;
  margin-bottom: 1rem;
  padding-top: 8px;
  padding-bottom: 8px;
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
  mask-image:         linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
}

.skills-track {
  animation: skills-scroll 28s linear infinite;
  will-change: transform;
  backface-visibility: hidden;
}

@keyframes skills-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
</style>
