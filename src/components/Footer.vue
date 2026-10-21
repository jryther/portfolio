<template>
  <footer class="border-t border-line">
    <div class="wrap flex flex-wrap items-center justify-between gap-6 py-10 max-md:flex-col max-md:items-start">
      <p class="text-sm text-ash">
        &copy; {{ year }} Josh Ryther <span class="text-smoke">·</span> Built with Vue, Vite &amp; wllama <span class="text-smoke">·</span> Made in Salem, OR
      </p>

      <div class="flex items-center gap-1">
        <a
          v-for="link in links"
          :key="link.label"
          :href="link.href"
          :target="link.external ? '_blank' : undefined"
          :rel="link.external ? 'noreferrer' : undefined"
          :aria-label="link.label"
          :title="link.label"
          class="inline-flex items-center justify-center w-[3.6rem] h-[3.6rem] rounded-lg text-ash transition-colors duration-200 hover:text-amber hover:bg-snow/[.05]"
        >
          <svg
            viewBox="0 0 24 24"
            class="w-[1.8rem] h-[1.8rem]"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          ><path :d="link.icon" /></svg>
        </a>
      </div>
    </div>
    <p class="wrap pb-8 text-2xs text-ash">
      TestNav is a trademark of Pearson Education, Inc. All product names are used for identification purposes only.
    </p>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()

const links = [
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/joshua-ryther-121400109',
    external: true,
    icon: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6ZM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
  },
  {
    label: 'Email',
    href: 'mailto:jryther91@gmail.com',
    external: false,
    icon: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm17 2-9 6-9-6',
  },
]
</script>
