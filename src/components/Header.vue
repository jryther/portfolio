<template>
  <header
    class="header-fixed"
    :class="{ scrolled: isScrolled || isMenuOpen }"
  >
    <div class="wrap header-bar">
      <a
        href="#home"
        class="brand"
        :aria-label="t('header.home')"
        @click="isMenuOpen = false"
      >
        <svg
          viewBox="0 0 32 32"
          class="brand-mark"
          aria-hidden="true"
        >
          <rect
            width="32"
            height="32"
            rx="8"
            fill="var(--color-surface-2)"
            stroke="var(--color-line-strong)"
          />
          <path
            d="M5 24 13.5 11l2.5 3 3-5.5L27 24Z"
            fill="var(--color-amber)"
          />
          <path
            d="m16 14 3-5.5 2.6 4.8-1.8-.9-1.3 1.6-1.1-.9Z"
            fill="#F4F1EA"
          />
        </svg>
        <span class="brand-name">Josh Ryther</span>
      </a>

      <!-- Hamburger — phones only; shown at the far right, but first in Tab order so its links follow it -->
      <button
        ref="menuBtn"
        class="menu"
        :class="{ active: isMenuOpen }"
        :aria-label="t('header.toggleMenu')"
        :aria-expanded="isMenuOpen"
        aria-controls="site-nav"
        @click="isMenuOpen = !isMenuOpen"
      >
        <span />
        <span />
        <span />
      </button>

      <!-- Nav links — inline on desktop, dropdown below header on mobile -->
      <nav
        id="site-nav"
        class="nav"
        :class="{ active: isMenuOpen }"
        @focusout="onNavFocusOut"
      >
        <ul>
          <li
            v-for="link in links"
            :key="link.id"
          >
            <a
              :href="`#${link.id}`"
              class="nav-link"
              :class="{ current: activeId === link.id }"
              :aria-current="activeId === link.id ? 'true' : undefined"
              @click="isMenuOpen = false"
            >{{ t(`header.nav.${link.id}`) }}</a>
          </li>
          <li class="nav-resume">
            <ResumeMenu
              button-class="button-ghost resume-btn"
              align="end"
            >
              {{ t('header.resume') }}
            </ResumeMenu>
          </li>
        </ul>
      </nav>

      <!-- Background animation, language and theme toggles: after the links on desktop, beside the menu button on phones -->
      <div class="header-controls">
        <SceneToggle />
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ResumeMenu from './ResumeMenu.vue'
import ThemeToggle from './ThemeToggle.vue'
import SceneToggle from './SceneToggle.vue'
import LanguageToggle from './LanguageToggle.vue'

const { t } = useI18n()

// Labels are header.nav.<id> in the locale files
const links = [
  { id: 'about' },
  { id: 'projects' },
  { id: 'chat' },
  { id: 'contact' },
]

const isMenuOpen = ref<boolean>(false)
const menuBtn    = ref<HTMLButtonElement | null>(null)
const isScrolled = ref<boolean>(false)
const activeId   = ref<string>('')

let sectionObserver: IntersectionObserver | null = null

function onKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !isMenuOpen.value) return
  isMenuOpen.value = false
  menuBtn.value?.focus()
}

// Tabbing out of the open menu closes it, so it never covers what has focus
function onNavFocusOut(e: FocusEvent) {
  const next = e.relatedTarget as Node | null
  if (isMenuOpen.value && next && !(e.currentTarget as HTMLElement).contains(next) && next !== menuBtn.value) isMenuOpen.value = false
}

function onScroll() {
  isScrolled.value = window.scrollY > 8
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeyDown)

  // Highlight the nav link for whichever section crosses the upper-middle of the viewport
  sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) activeId.value = entry.target.id
    })
  }, { rootMargin: '-40% 0px -55% 0px' })

  ;['home', ...links.map(l => l.id)].forEach(id => {
    const el = document.getElementById(id)
    if (el) sectionObserver?.observe(el)
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  sectionObserver?.disconnect()
})
</script>

<style scoped>
.header-fixed {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 100;
  height: 6.8rem;
  border-bottom: 1px solid transparent;
  transition: background-color 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease;
}

.header-fixed.scrolled {
  background-color: color-mix(in srgb, var(--color-charcoal) 72%, transparent);
  border-bottom-color: var(--color-line);
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-snow);
  font-weight: 600;
  font-size: 1.6rem;
  letter-spacing: -0.01em;
}

.brand-mark {
  width: 2.8rem;
  height: 2.8rem;
}

.brand-name {
  white-space: nowrap;
}

:deep(.resume-btn) {
  padding: 0.9rem 1.4rem;
  font-size: 1.4rem;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: 1.5rem;
}

/* Desktop nav — inline links, hamburger hidden */
.nav     { display: flex; align-items: center; margin-left: auto; }
.nav ul  { display: flex; align-items: center; gap: 3.2rem; }
.menu    { display: none; }

.nav-link {
  position: relative;
  font-size: 1.45rem;
  font-weight: 500;
  color: var(--color-mist);
  transition: color 0.2s ease;
}
.nav-link:hover,
.nav-link.current { color: var(--color-snow); }

/* Small amber dot under the active link */
.nav-link::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -0.9rem;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-amber);
  transform: translateX(-50%) scale(0);
  transition: transform 0.2s ease;
}
.nav-link.current::after { transform: translateX(-50%) scale(1); }

/* ── Mobile ── */
@media (max-width: 768px) {
  .header-fixed { height: 6rem; }
  .header-controls { order: 2; margin-left: auto; margin-right: 1.2rem; }

  .menu {
    order: 3;
    display: flex;
    flex-direction: column;
    gap: 5px;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0.8rem;
    margin-right: -0.8rem;
    z-index: 101;
  }
  .menu span { width: 22px; height: 2px; border-radius: 2px; background-color: var(--color-snow); transition: all 0.3s; display: block; }

  .menu.active span:nth-child(1) { transform: rotate(45deg)  translate(5px,  5px); }
  .menu.active span:nth-child(2) { opacity: 0; }
  .menu.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

  /* Nav is a dropdown panel that slides below the header bar */
  .nav {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background-color: color-mix(in srgb, var(--color-charcoal) 96%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    max-height: 0;
    overflow: hidden;
    visibility: hidden;
    transition: max-height 0.3s ease, visibility 0s linear 0.3s;
  }
  /* Room for the links plus the open resume formats */
  .nav.active { max-height: 560px; visibility: visible; transition: max-height 0.3s ease; border-bottom: 1px solid var(--color-line); }

  .nav ul {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    width: 100%;   /* the panel lays out in a row; without this the list shrinks to its content */
    padding: 0.8rem 2.4rem 2rem;
  }

  .nav-link {
    display: block;
    padding: 1.4rem 0;
    font-size: 1.8rem;
    border-bottom: 1px solid var(--color-line);
  }
  .nav-link::after { display: none; }
  .nav-link.current { color: var(--color-amber); }

  .nav-resume { padding-top: 1.6rem; }
  .nav-resume :deep(.resume-menu),
  .nav-resume :deep(.resume-btn) { width: 100%; }
  /* Inside the phone menu the formats open in place, below the button (a floating list
     would be clipped by the dropdown panel) */
  .nav-resume :deep(.resume-menu-list) { position: static; margin-top: 0.6rem; width: 100%; box-shadow: none; }
}

/* The smallest phones can't fit the name beside three toggles and the menu: the mountain
   mark stands alone (the link keeps its aria-label) */
@media (max-width: 359px) {
  .brand-name { display: none; }
}
</style>
