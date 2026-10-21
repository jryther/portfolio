<template>
  <form
    class="flex flex-col gap-6"
    @submit.prevent="handleSubmit"
  >
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <label class="flex flex-col gap-2">
        <span class="field-label">{{ t('form.name') }}</span>
        <input
          v-model="formData.name"
          type="text"
          name="name"
          autocomplete="name"
          :placeholder="t('form.namePlaceholder')"
          required
          class="field"
        >
      </label>

      <label class="flex flex-col gap-2">
        <span class="field-label">{{ t('form.email') }}</span>
        <input
          v-model="formData.email"
          type="email"
          name="email"
          autocomplete="email"
          :placeholder="t('form.emailPlaceholder')"
          required
          class="field"
        >
      </label>
    </div>

    <label class="flex flex-col gap-2">
      <span class="field-label">{{ t('form.message') }}</span>
      <textarea
        v-model="formData.message"
        name="message"
        :placeholder="t('form.messagePlaceholder')"
        rows="5"
        required
        class="field resize-y min-h-[15rem]"
      />
    </label>

    <button
      type="submit"
      class="button self-start py-[1.3rem] px-[2.4rem] max-xs:self-stretch"
    >
      {{ t('form.submit') }}
    </button>

    <p
      v-if="submitted"
      class="success-message flex items-center gap-3 p-4 bg-moss/10 border border-moss/40 rounded-lg text-snow text-base"
      role="status"
    >
      <svg
        viewBox="0 0 16 16"
        class="w-[1.6rem] h-[1.6rem] flex-shrink-0 text-moss"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      ><path d="m3 8.5 3 3 7-7" /></svg>
      {{ t('form.success') }}
    </p>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface FormData {
  name: string
  email: string
  message: string
}

const { t } = useI18n()

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
.field-label {
  font-family: var(--font-mono);
  font-size: 1.15rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ash);
}

.success-message {
  animation: slideIn 0.3s ease-in-out;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
