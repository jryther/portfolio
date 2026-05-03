<template>
  <form @submit.prevent="handleSubmit" class="max-w-[600px] mx-auto my-12 flex flex-col gap-6 max-md:my-8 max-md:gap-4">

    <div class="flex flex-col">
      <input
        type="text"
        v-model="formData.name"
        placeholder="Your Name"
        required
        class="p-4 border border-forest/40 bg-forest/[.08] rounded-lg text-snow text-body transition-all duration-300 focus:outline-none focus:border-amber focus:bg-forest/15 focus:shadow-[0_0_10px_rgba(212,165,116,0.2)] placeholder:text-smoke max-md:text-base max-md:p-[0.8rem]"
      />
    </div>

    <div class="flex flex-col">
      <input
        type="email"
        v-model="formData.email"
        placeholder="Your Email"
        required
        class="p-4 border border-forest/40 bg-forest/[.08] rounded-lg text-snow text-body transition-all duration-300 focus:outline-none focus:border-amber focus:bg-forest/15 focus:shadow-[0_0_10px_rgba(212,165,116,0.2)] placeholder:text-smoke max-md:text-base max-md:p-[0.8rem]"
      />
    </div>

    <div class="flex flex-col">
      <textarea
        v-model="formData.message"
        placeholder="Your Message"
        rows="5"
        required
        class="p-4 border border-forest/40 bg-forest/[.08] rounded-lg text-snow text-body resize-y min-h-[150px] transition-all duration-300 focus:outline-none focus:border-amber focus:bg-forest/15 focus:shadow-[0_0_10px_rgba(212,165,116,0.2)] placeholder:text-smoke max-md:text-base max-md:p-[0.8rem]"
      ></textarea>
    </div>

    <button type="submit" class="button py-[1.2rem] px-8 mt-4 text-body">
      Send Message
    </button>

    <p v-if="submitted" class="success-message p-4 bg-forest/20 border border-amber rounded-lg text-amber text-center text-base">
      ✅ Message sent successfully! I'll get back to you soon.
    </p>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const formData  = ref({ name: '', email: '', message: '' })
const submitted = ref(false)

const handleSubmit = async () => {
  const formspreeEndpoint = 'https://formspree.io/f/YOUR_FORM_ID'
  try {
    const response = await fetch(formspreeEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData.value)
    })
    if (response.ok) {
      submitted.value = true
      formData.value = { name: '', email: '', message: '' }
      setTimeout(() => { submitted.value = false }, 5000)
    }
  } catch (error) {
    console.error('Error submitting form:', error)
  }
}
</script>

<style scoped>
.success-message {
  animation: slideIn 0.3s ease-in-out;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
