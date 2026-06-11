<template>
  <header class="header-fixed">
    <div class="logo" />

    <!-- Hamburger — lives in the header bar, hidden on desktop -->
    <button
      class="menu"
      :class="{ active: isMenuOpen }"
      aria-label="Toggle menu"
      @click="isMenuOpen = !isMenuOpen"
    >
      <span />
      <span />
      <span />
    </button>

    <!-- Nav links — inline on desktop, dropdown below header on mobile -->
    <nav
      class="nav"
      :class="{ active: isMenuOpen }"
    >
      <ul>
        <li>
          <a
            href="#home"
            class="text-snow font-medium transition-colors duration-300 hover:text-amber"
            @click="isMenuOpen = false"
          >Home</a>
        </li>
        <li>
          <a
            href="#about"
            class="text-snow font-medium transition-colors duration-300 hover:text-amber"
            @click="isMenuOpen = false"
          >About</a>
        </li>
        <li>
          <a
            href="#projects"
            class="text-snow font-medium transition-colors duration-300 hover:text-amber"
            @click="isMenuOpen = false"
          >Projects</a>
        </li>
        <li>
          <a
            href="#contact"
            class="text-snow font-medium transition-colors duration-300 hover:text-amber"
            @click="isMenuOpen = false"
          >Contact</a>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const isMenuOpen = ref<boolean>(false)
</script>

<style scoped>
.header-fixed {
  position: fixed;
  width: 100%;
  left: 0;
  top: 0;
  z-index: 100;
  background-color: rgba(15, 20, 25, 0.92);
  padding: 0 5%;
  min-height: 6.4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.5s;
}

.logo { color: #D4A574; font-size: 1.8rem; font-weight: 700; }

/* Desktop nav — inline links, hamburger hidden */
.nav          { display: flex; align-items: center; }
.nav ul       { display: flex; gap: 2rem; list-style: none; margin: 0; padding: 0; }
.menu         { display: none; }

/* ── Mobile ── */
@media (max-width: 768px) {
  .header-fixed {
    padding: 0 2rem;
    min-height: 5.6rem;
  }

  /* Hamburger sits in the header bar */
  .menu {
    display: flex;
    flex-direction: column;
    gap: 5px;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    z-index: 101;
  }
  .menu span { width: 25px; height: 2px; background-color: #fff; transition: all 0.3s; display: block; }

  .menu.active span:nth-child(1) { transform: rotate(45deg)  translate(5px,  7px); }
  .menu.active span:nth-child(2) { opacity: 0; }
  .menu.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -7px); }

  /* Nav is a dropdown panel that slides below the header bar */
  .nav {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background-color: rgba(15, 20, 25, 0.97);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    flex-direction: column;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }
  .nav.active { max-height: 400px; }

  .nav ul {
    flex-direction: column;
    gap: 0;
    padding: 1rem 2rem 1.5rem;
  }

  .nav ul li a {
    display: block;
    padding: 1rem 0;
    font-size: 1.8rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .nav ul li:last-child a {
    border-bottom: none;
  }
}
</style>
