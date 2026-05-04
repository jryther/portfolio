<template>
  <footer class="bg-black/50 border-t border-[rgba(35,206,107,0.2)] px-[5%] pt-16 pb-8 text-mist max-md:px-8 max-md:pt-8 max-md:pb-4">
    <div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-12 max-w-[900px] mx-auto mb-12 max-md:gap-8 max-md:mb-8 max-xs:grid-cols-1 max-xs:gap-6">
      <div class="flex flex-col items-center text-center">
        <h3 class="text-amber text-body font-bold mb-6 max-md:text-xl">
          Quick Links
        </h3>
        <ul class="text-center">
          <li class="mb-4">
            <a
              href="#home"
              class="text-mist hover:text-amber transition-colors duration-300"
            >Home</a>
          </li>
          <li class="mb-4">
            <a
              href="#about"
              class="text-mist hover:text-amber transition-colors duration-300"
            >About</a>
          </li>
          <li class="mb-4">
            <a
              href="#projects"
              class="text-mist hover:text-amber transition-colors duration-300"
            >Projects</a>
          </li>
          <li class="mb-4">
            <a
              href="#contact"
              class="text-mist hover:text-amber transition-colors duration-300"
            >Contact</a>
          </li>
        </ul>
      </div>

      <div class="flex flex-col items-center text-center">
        <h3 class="text-amber text-body font-bold mb-6 max-md:text-xl">
          Professional
        </h3>
        <ul class="text-center">
          <li class="mb-4">
            <a
              href="https://linkedin.com/in/joshua-ryther-121400109"
              target="_blank"
              rel="noreferrer"
              class="text-mist hover:text-amber transition-colors duration-300"
            >LinkedIn</a>
          </li>
          <li class="mb-4">
            <a
              href="https://github.com/jryther"
              target="_blank"
              rel="noreferrer"
              class="text-mist hover:text-amber transition-colors duration-300"
            >GitHub</a>
          </li>
          <li class="mb-4">
            <a
              href="mailto:jryther91@gmail.com"
              class="text-mist hover:text-amber transition-colors duration-300"
            >Email</a>
          </li>
        </ul>
      </div>

      <div class="flex flex-col items-center text-center">
        <h3 class="text-amber text-body font-bold mb-6 max-md:text-xl">
          Resources
        </h3>
        <ul class="text-center">
          <li class="mb-4">
            <a
              href="/portfolio-v3/Resume.pdf"
              download
              class="text-mist hover:text-amber transition-colors duration-300"
            >Download Resume</a>
          </li>
          <li class="mb-4">
            <a
              href="mailto:hello@example.com"
              class="text-mist hover:text-amber transition-colors duration-300"
            >Send Email</a>
          </li>
          <li class="mb-4">
            <a
              href="#contact"
              class="text-mist hover:text-amber transition-colors duration-300"
            >Contact Form</a>
          </li>
        </ul>
      </div>
    </div>

    <div class="text-center pt-8 border-t border-[rgba(35,206,107,0.1)] text-smoke text-base max-md:text-sm">
      <p class="my-2">
        &copy; 2026 Full-Stack Software Engineer. All rights reserved.
      </p>
      <p class="my-2">
        Built with Vue 3, Vite &amp; modern web technologies ⚡
      </p>
      <p class="mt-4 text-2xs text-[#555]">
        TestNav is a trademark of Pearson Education, Inc. All product names are used for identification purposes only.
      </p>
    </div>
  </footer>
</template>
