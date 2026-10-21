<template>
  <div id="app">
    <a
      href="#main"
      class="skip-link"
    >Skip to content</a>
    <Header />
    <main
      id="main"
      tabindex="-1"
    >
      <Hero />
      <About />
      <Project />
      <ChatSection />
      <Contact />
    </main>
    <Footer />
    <!-- Floating chat popup; hides while the chat section is on screen -->
    <AiChat />
  </div>
</template>

<script setup lang="ts">
import Header from './components/Header.vue'
import Hero from './components/Hero.vue'
import AiChat from './components/AiChat/AiChat.vue'
import About from './components/About.vue'
import Project from './components/Project.vue'
import ChatSection from './components/ChatSection.vue'
import Contact from './components/Contact.vue'
import Footer from './components/Footer.vue'
</script>
