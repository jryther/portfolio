<template>
  <header class="header-fixed">
    <div class="logo"></div>

    <nav class="nav" :class="{ active: isMenuOpen }">
      <button
        class="menu"
        :class="{ active: isMenuOpen }"
        @click="isMenuOpen = !isMenuOpen"
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <ul>
        <li><a href="#home"     @click="isMenuOpen = false" class="text-snow font-medium transition-colors duration-300 hover:text-amber">Home</a></li>
        <li><a href="#about"    @click="isMenuOpen = false" class="text-snow font-medium transition-colors duration-300 hover:text-amber">About</a></li>
        <li><a href="#projects" @click="isMenuOpen = false" class="text-snow font-medium transition-colors duration-300 hover:text-amber">Projects</a></li>
        <li><a href="#contact"  @click="isMenuOpen = false" class="text-snow font-medium transition-colors duration-300 hover:text-amber">Contact</a></li>
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
  top: 0;
  z-index: 100;
  background-color: rgba(15, 20, 25, 0.92);
  padding: 1rem 5%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.5s;
}

.logo { color: #D4A574; font-size: 1.8rem; font-weight: 700; }

/* Desktop nav */
.nav          { display: flex; align-items: center; gap: 3rem; }
.nav ul       { display: flex; gap: 2rem; list-style: none; margin: 0; padding: 0; }
.menu         { display: none; }

/* Mobile */
@media (max-width: 768px) {
  .header-fixed { padding: 1rem 2rem; }

  .nav {
    position: absolute;
    top: 100%; left: 0; width: 100%;
    background-color: rgba(33, 33, 33, 0.95);
    flex-direction: column;
    padding: 2rem;
    gap: 0;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s;
  }
  .nav.active { max-height: 400px; }

  .nav ul { flex-direction: column; gap: 1.5rem; margin-top: 2rem; }

  .menu {
    display: flex;
    flex-direction: column;
    gap: 5px;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
  }
  .menu span { width: 25px; height: 2px; background-color: #fff; transition: all 0.3s; display: block; }

  .menu.active span:nth-child(1) { transform: rotate(45deg)  translate(5px,  7px); }
  .menu.active span:nth-child(2) { opacity: 0; }
  .menu.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -7px); }
}
</style>
