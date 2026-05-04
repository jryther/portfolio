<template>
  <section
    id="contact"
    class="py-32 px-[5%] bg-[linear-gradient(135deg,_rgba(45,80,22,0.1)_0%,_rgba(15,20,25,0.95)_100%)] max-md:py-16 max-md:px-8 max-xs:py-8 max-xs:px-4"
  >
    <header class="text-center mb-12">
      <h2 class="text-3xl mb-4 text-snow max-md:text-2xl max-xs:text-xl">
        Let's Connect
      </h2>
      <p class="text-body text-mist my-2 max-md:text-base">
        I'm always interested in discussing new opportunities, technical challenges, and collaborations.
      </p>
      <p class="text-body text-mist my-2 max-md:text-base">
        Whether you're looking for a full-stack developer, need technical insights, or just want to chat about software engineering, feel free to reach out!
      </p>
    </header>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8 mb-16 text-center max-md:grid-cols-1 max-md:gap-6">
      <div class="p-8 bg-forest/[.12] border border-forest/40 rounded-2xl transition-all duration-300 hover:bg-forest/20 hover:border-amber max-xs:p-6">
        <a
          href="mailto:jryther91@gmail.com"
          title="Email"
          class="block my-4 text-[2.5rem]"
        >📧</a>
        <a
          href="mailto:jryther91@gmail.com"
          class="block my-4 text-amber text-body font-medium transition-colors duration-300 hover:text-snow"
        >jryther91@gmail.com</a>
      </div>
    </div>

    <ContactForm />
  </section>
</template>

<script setup lang="ts">
import ContactForm from './ContactForm.vue'
</script>
