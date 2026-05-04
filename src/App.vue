<template>
  <div id="app">
    <Header />
    <main>
      <Hero />
      <About />
      <Project />
      <Contact />
    </main>
    <Footer />
    <!-- Fixed floating chatbot overlay — only renders if WebGPU is supported -->
    <AiChat />
  </div>
</template>

<script setup lang="ts">
import Header from './components/Header.vue'
import Hero from './components/Hero.vue'
import AiChat from './components/AiChat/AiChat.vue'
import About from './components/About.vue'
import Project from './components/Project.vue'
import Contact from './components/Contact.vue'
import Footer from './components/Footer.vue'
</script>
