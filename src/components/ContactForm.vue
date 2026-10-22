<template>
  <form
    class="contact-form"
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
      <!-- Capped so the prefilled email stays within what mail apps accept from a link -->
      <textarea
        v-model="formData.message"
        name="message"
        :placeholder="t('form.messagePlaceholder')"
        rows="5"
        :maxlength="MESSAGE_MAX"
        required
        class="field message-field"
      />
    </label>

    <div class="submit-row">
      <button
        type="submit"
        class="button submit-btn"
        aria-describedby="contact-form-hint"
      >
        {{ t('form.submit') }}
      </button>
      <p
        id="contact-form-hint"
        class="form-hint"
      >
        {{ t('form.hint') }}
      </p>
    </div>

    <!-- A live region kept in the DOM, so screen readers announce the note when it appears -->
    <div role="status">
      <div
        v-if="opened"
        class="form-message"
      >
        <svg
          viewBox="0 0 24 24"
          class="message-icon"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        ><path :d="EMAIL_ICON" /></svg>
        <p>
          {{ t('form.opened') }}
          {{ t('form.fallback') }}
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
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CONTACT_EMAIL, EMAIL_ICON } from '../data/contact'

// No server: sending opens the visitor's own email app, addressed to Josh with their message
// filled in. The text stays in the form, since the page can't tell whether they sent it.

interface FormData {
  name: string
  email: string
  message: string
}

// Mail apps cut off very long prefilled links; this keeps the encoded link well within them
const MESSAGE_MAX = 1500

const { t } = useI18n()

const formData = ref<FormData>({ name: '', email: '', message: '' })
const opened   = ref<boolean>(false)

/** The mailto: link for the current form: subject with the visitor's name, then their message
 * and how to reply */
function mailtoLink({ name, email, message }: FormData): string {
  const subject = t('form.subject', { name: name.trim() })
  const body = `${message.trim()}\n\n${name.trim()}\n${email.trim()}`
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

// The browser has already checked the fields (required, valid email) before this runs
function handleSubmit() {
  window.location.assign(mailtoLink(formData.value))
  opened.value = true
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

.submit-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem 1.6rem;
}

.submit-btn {
  padding: 1.3rem 2.4rem;
}

.form-hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-ash);
}

@media (width < 480px) {
  .submit-btn { flex: 1 1 100%; }
}

.field-label {
  font-family: var(--font-mono);
  font-size: 1.15rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ash);
}

.form-message {
  --tone: var(--color-moss);
  display: flex;
  align-items: flex-start;
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
.form-message p {
  margin: 0;
}

.message-icon {
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
  margin-top: 0.2rem;
  color: var(--tone);
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
@media (prefers-reduced-motion: reduce) {
  .form-message { animation: none; }
}
</style>
