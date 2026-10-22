<template>
  <form
    class="contact-form"
    :aria-busy="sending"
    @submit.prevent="handleSubmit"
  >
    <div class="form-row">
      <label class="form-field">
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

      <label class="form-field">
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

    <label class="form-field">
      <span class="field-label">{{ t('form.message') }}</span>
      <textarea
        v-model="formData.message"
        name="message"
        :placeholder="t('form.messagePlaceholder')"
        rows="5"
        required
        class="field message-field"
      />
    </label>

    <!-- aria-disabled rather than disabled while sending, so the button keeps keyboard focus -->
    <button
      type="submit"
      class="button submit-btn"
      :aria-disabled="sending"
    >
      {{ sending ? t('form.sending') : t('form.submit') }}
    </button>

    <!-- Live regions stay in the DOM so screen readers announce the result when it appears -->
    <div role="status">
      <p
        v-if="state === 'sent'"
        class="form-message success-message"
      >
        <svg
          viewBox="0 0 16 16"
          class="message-icon"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        ><path d="m3 8.5 3 3 7-7" /></svg>
        {{ t('form.success') }}
      </p>
    </div>
    <div role="alert">
      <div
        v-if="state === 'failed'"
        class="form-message error-message"
      >
        <UiIcon
          name="alert-circle"
          class="message-icon"
        />
        <p>
          {{ offline ? t('form.errorOffline') : t('form.error') }}
          {{ t('form.errorFallback') }}
          <a
            :href="`mailto:${CONTACT_EMAIL}`"
            class="fallback-link"
          >{{ CONTACT_EMAIL }}</a>.
        </p>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from './icons/UiIcon.vue'
import { createLogger, handleError } from '../services/errors'

interface FormData {
  name: string
  email: string
  message: string
}

type SendState = 'idle' | 'sending' | 'sent' | 'failed'

const CONTACT_EMAIL = 'jryther91@gmail.com'
// The owner still has to fill in the form ID (see .ai/CONTEXT.md)
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID'
// Give up on a request that hangs, so the button doesn't say "Sending…" forever
const SEND_TIMEOUT_MS = 15000
const SUCCESS_VISIBLE_MS = 5000

const { t } = useI18n()
const log = createLogger('contact')

const formData = ref<FormData>({ name: '', email: '', message: '' })
const state    = ref<SendState>('idle')
const offline  = ref<boolean>(false)
const sending  = computed(() => state.value === 'sending')

let successTimer: ReturnType<typeof setTimeout> | undefined

// Formspree explains a rejected submission in { errors: [{ message }] }
async function failureDetails(response: Response): Promise<string> {
  try {
    const body = await response.json() as { errors?: { message?: string }[] }
    const details = body.errors?.map(e => e.message).filter(Boolean).join('; ')
    return details ? `: ${details}` : ''
  } catch {
    return ''
  }
}

const handleSubmit = async (): Promise<void> => {
  if (sending.value) return
  clearTimeout(successTimer)
  state.value = 'sending'
  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(formData.value),
      signal: AbortSignal.timeout?.(SEND_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`Formspree responded ${response.status}${await failureDetails(response)}`)

    state.value = 'sent'
    formData.value = { name: '', email: '', message: '' }
    successTimer = setTimeout(() => { state.value = 'idle' }, SUCCESS_VISIBLE_MS)
  } catch (error: unknown) {
    // The visitor's text stays in the form so they can retry without retyping it
    offline.value = !navigator.onLine
    state.value = 'failed'
    handleError('contact', 'Message failed to send', error, { level: offline.value ? 'warn' : 'error' })
    if (FORMSPREE_ENDPOINT.includes('YOUR_FORM_ID')) log.warn('The Formspree form ID is still a placeholder; set it in ContactForm.vue')
  }
}

onUnmounted(() => clearTimeout(successTimer))
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
.submit-btn[aria-disabled="true"] {
  opacity: 0.6;
  cursor: progress;
}

@media (width < 480px) {
  .submit-btn { align-self: stretch; }
}

.field-label {
  font-family: var(--font-mono);
  font-size: 1.15rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ash);
}

/* Success and error share a shape; --tone picks the colour */
.form-message {
  --tone: var(--color-moss);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid color-mix(in srgb, var(--tone) 40%, transparent);
  border-radius: 0.5rem;
  background-color: color-mix(in srgb, var(--tone) 10%, transparent);
  color: var(--color-snow);
  font-size: var(--text-base);
  line-height: var(--leading-base);
  animation: slideIn 0.3s ease-in-out;
}
.error-message {
  --tone: var(--color-rust);
  align-items: flex-start;
}

.message-icon {
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
  color: var(--tone);
}
.error-message .message-icon {
  margin-top: 0.2rem;
}

.fallback-link {
  color: var(--color-amber);
  text-decoration: underline;
  text-underline-offset: 0.3rem;
  overflow-wrap: anywhere;
}
.fallback-link:hover {
  color: var(--color-golden);
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
