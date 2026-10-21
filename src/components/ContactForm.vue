<template>
  <form
    class="contact-form"
    @submit.prevent="handleSubmit"
  >
    <div class="form-row">
      <label class="form-field">
        <span class="field-label">Name</span>
        <input
          v-model="formData.name"
          type="text"
          name="name"
          autocomplete="name"
          placeholder="Jane Doe"
          required
          class="field"
        >
      </label>

      <label class="form-field">
        <span class="field-label">Email</span>
        <input
          v-model="formData.email"
          type="email"
          name="email"
          autocomplete="email"
          placeholder="jane@company.com"
          required
          class="field"
        >
      </label>
    </div>

    <label class="form-field">
      <span class="field-label">Message</span>
      <textarea
        v-model="formData.message"
        name="message"
        placeholder="What would you like to talk about?"
        rows="5"
        required
        class="field message-field"
      />
    </label>

    <button
      type="submit"
      class="button submit-btn"
    >
      Send Message
    </button>

    <p
      v-if="submitted"
      class="success-message"
      role="status"
    >
      <svg
        viewBox="0 0 16 16"
        class="success-icon"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      ><path d="m3 8.5 3 3 7-7" /></svg>
      Message sent successfully! I'll get back to you soon.
    </p>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface FormData {
  name: string
  email: string
  message: string
}

const formData  = ref<FormData>({ name: '', email: '', message: '' })
const submitted = ref<boolean>(false)

const handleSubmit = async (): Promise<void> => {
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
  } catch (error: unknown) {
    console.error('Error submitting form:', error)
  }
}
</script>

<style scoped>
.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
}

@media (min-width: 640px) {
  .form-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message-field {
  min-height: 15rem;
  resize: vertical;
}

.submit-btn {
  align-self: flex-start;
  padding: 1.3rem 2.4rem;
}

@media (width < 480px) {
  .submit-btn { align-self: stretch; }
}

.success-icon {
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
  color: var(--color-moss);
}

.field-label {
  font-family: var(--font-mono);
  font-size: 1.15rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ash);
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid color-mix(in srgb, var(--color-moss) 40%, transparent);
  border-radius: 0.5rem;
  background-color: color-mix(in srgb, var(--color-moss) 10%, transparent);
  color: var(--color-snow);
  font-size: var(--text-base);
  line-height: var(--leading-base);
  animation: slideIn 0.3s ease-in-out;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
