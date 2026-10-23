<template>
  <div
    ref="panelEl"
    class="chat-panel"
    :class="{ 'is-large': large }"
    tabindex="-1"
  >
    <!-- Each finished answer is read out once from here, rather than every frame of it typing out
         (and without the follow-up chips) -->
    <p
      class="sr-only"
      :aria-live="live ? 'polite' : 'off'"
    >
      {{ announcement }}
    </p>

    <!-- Chat messages -->
    <div
      ref="messagesEl"
      class="messages"
    >
      <template
        v-for="(msg, i) in messages"
        :key="i"
      >
        <div
          v-if="msg.text !== ''"
          class="message"
          :class="{ 'is-user': msg.role === 'user' }"
        >
          <div
            v-if="msg.role === 'assistant'"
            class="avatar"
          >
            <SparkleIcon class="avatar-icon" />
          </div>
          <div
            class="bubble"
            :class="msg.role === 'user' ? 'from-user' : 'from-assistant'"
          >
            <template
              v-for="(part, p) in linkParts(msg.text)"
              :key="p"
            >
              <!-- v-text, so the bubble's pre-wrap shows no template whitespace -->
              <a
                v-if="part.href"
                :href="part.href"
                :target="part.external ? '_blank' : undefined"
                :rel="part.external ? 'noreferrer' : undefined"
                class="bubble-link"
                v-text="part.text"
              />
              <span
                v-else
                v-text="part.text"
              />
            </template>
          </div>
        </div>
      </template>

      <!-- Follow-up topics for the latest answer -->
      <div
        v-if="followUps.length"
        ref="chipsEl"
        class="chips"
      >
        <button
          v-for="id in followUps"
          :key="id"
          class="topic-chip"
          @click="pickTopic(id, $event)"
        >
          {{ topicLabel(id, locale) }}
        </button>
      </div>

      <!-- Thinking indicator -->
      <div
        v-if="thinking"
        class="message thinking"
        role="img"
        :aria-label="t('chat.thinking')"
      >
        <div class="avatar">
          <SparkleIcon class="avatar-icon" />
        </div>
        <div class="typing">
          <span class="dot" />
          <span class="dot" />
          <span class="dot" />
        </div>
      </div>
    </div>

    <!-- AI model status: optional, chips and quick answers work without it -->
    <div
      v-if="modelStatus !== 'ready'"
      class="model-status"
    >
      <div
        v-if="modelStatus === 'idle'"
        class="model-offer"
      >
        <p class="status-text offer-text">
          {{ t('chat.loadPrompt') }}
        </p>
        <button
          v-tooltip="t('chat.loadTitle', { name: MODEL.name, size: MODEL.sizeLabel })"
          class="button-ghost load-btn"
          @click="startModel"
        >
          {{ t('chat.loadButton', { size: MODEL.sizeLabel }) }}
        </button>
      </div>
      <div
        v-else-if="modelStatus === 'loading' || modelStatus === 'paused'"
        class="model-loading"
        :class="{ 'is-paused': modelStatus === 'paused' }"
      >
        <div class="status-text progress-row">
          <span class="progress-label">{{ modelStatus === 'paused' ? t('chat.paused', { progress: loadingProgress }) : loadingText }}</span>
          <span
            v-if="modelStatus === 'loading'"
            class="progress-value"
          >{{ loadingProgress }}%</span>
          <!-- One button that flips between Pause and Resume, so keyboard focus stays on it.
               Only while downloading: a load from the cache is over in a moment -->
          <button
            v-if="downloading || modelStatus === 'paused'"
            v-tooltip="modelStatus === 'paused' ? '' : t('chat.pauseTitle')"
            type="button"
            class="pause-btn"
            @click="modelStatus === 'paused' ? startModel() : pauseModel()"
          >
            <UiIcon
              :name="modelStatus === 'paused' ? 'play' : 'pause'"
              class="pause-icon"
            />
            {{ modelStatus === 'paused' ? t('chat.resume') : t('chat.pause') }}
          </button>
        </div>
        <!-- The percentage beside it says the same, so the bar is decoration -->
        <div
          class="progress-track"
          aria-hidden="true"
        >
          <div
            class="progress-bar"
            :style="{ width: loadingProgress + '%' }"
          />
        </div>
        <Transition name="hint">
          <button
            v-if="slowLoad && modelStatus === 'loading'"
            class="play-hint"
            @click="emit('play-game')"
          >
            <UiIcon
              name="game"
              class="play-hint-icon"
            />
            {{ t('chat.playWhileWait') }}
          </button>
        </Transition>
      </div>
      <p
        v-else
        class="status-text model-error"
      >
        {{ t('chat.loadError') }}
        <button
          class="retry-btn"
          @click="startModel"
        >
          {{ t('chat.tryAgain') }}
        </button>
      </p>
    </div>

    <!-- Input area -->
    <div class="composer">
      <!-- :value + @input rather than v-model, so phone keyboards update it mid-word -->
      <input
        ref="inputEl"
        :value="userInput"
        :placeholder="modelLoading ? t('chat.placeholderLoading') : t('chat.placeholder')"
        :aria-label="t('chat.inputLabel')"
        :disabled="busy || modelLoading"
        maxlength="400"
        class="chat-input"
        @input="userInput = ($event.target as HTMLInputElement).value"
        @keydown.enter="onEnter"
      >
      <div class="composer-footer">
        <p class="char-count">
          {{ userInput.length }}/400
        </p>
        <div class="composer-actions">
          <button
            class="clear-btn"
            :disabled="busy"
            @click="clearChat"
          >
            <UiIcon
              name="refresh"
              class="clear-icon"
            />
            {{ t('chat.clear') }}
          </button>
          <button
            :disabled="busy || modelLoading"
            class="button send-btn"
            @click="send($event)"
          >
            {{ t('chat.send') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import { vTooltip } from '../../directives/tooltip'
import { useI18n } from 'vue-i18n'
import SparkleIcon from '../icons/SparkleIcon.vue'
import UiIcon from '../icons/UiIcon.vue'
import { topicLabel } from '../../data/chatTree'
import { locale } from '../../i18n'
import { MODEL } from '../../services/chatModel'
import {
  messages, followUps, userInput, thinking, busy, modelStatus, modelLoading, loadingProgress, loadingText, slowLoad,
  downloading, startModel, pauseModel, sendMessage, askTopic, clearChat,
} from '../../composables/useChat'

// The conversation itself lives in useChat; this is one view of it (popup or full section)
// live: announce new messages to screen readers (off for a copy of the chat that's off screen)
withDefaults(defineProps<{ large?: boolean, live?: boolean }>(), { live: true })
const emit = defineEmits<{ 'play-game': [] }>()

const { t } = useI18n()

const panelEl    = ref<HTMLElement | null>(null)
const messagesEl = ref<HTMLElement | null>(null)
const inputEl    = ref<HTMLInputElement | null>(null)
const chipsEl    = ref<HTMLElement | null>(null)

// Where keyboard focus goes once the answer is in: back to the text box after a typed question,
// or to the first follow-up after a topic. Only for the keyboard; a tap or click leaves focus
// alone, so a phone doesn't pop its keyboard up over the answer
let focusAfterAnswer: 'input' | 'chips' | null = null
// A click with detail 0 came from the keyboard (Enter or Space on the button)
const fromKeyboard = (e?: Event) => !e || (e instanceof MouseEvent && e.detail === 0) || e instanceof KeyboardEvent

// The chips are replaced once the answer arrives, which would drop focus to <body> (and out of
// reach of the popup's Escape), so park it on the panel first, like the popup does on open
function pickTopic(id: string, e?: MouseEvent) {
  focusAfterAnswer = fromKeyboard(e) ? 'chips' : null
  panelEl.value?.focus({ preventScroll: true })
  askTopic(id)
}

// Same for the text box and Send button, which are disabled while the answer is on its way
function send(e?: Event) {
  sendMessage()
  if (!busy.value) return
  focusAfterAnswer = fromKeyboard(e) ? 'input' : null
  panelEl.value?.focus({ preventScroll: true })
}

// The latest answer, for the screen reader announcement once it has finished typing out
const announcement = ref('')
watch(busy, async (nowBusy, wasBusy) => {
  if (nowBusy || !wasBusy) return
  const last = messages.value[messages.value.length - 1]
  if (last?.role === 'assistant') announcement.value = last.text

  const target = focusAfterAnswer
  focusAfterAnswer = null
  // Only if focus is still parked on the panel (the visitor hasn't moved on)
  if (!target || document.activeElement !== panelEl.value) return
  await nextTick()
  const el = target === 'input' ? inputEl.value : chipsEl.value?.querySelector('button')
  el?.focus({ preventScroll: true })
})

// Email addresses and LinkedIn and GitHub profile URLs in an answer become links (built as
// elements, never HTML)
const LINK_RE = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|((?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in|github\.com)\/[\w-]+)/g
function linkParts(text: string): { text: string, href?: string, external?: boolean }[] {
  const parts: { text: string, href?: string, external?: boolean }[] = []
  let last = 0
  for (const m of text.matchAll(LINK_RE)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) })
    const [match, email] = m
    parts.push(email
      ? { text: match, href: `mailto:${match}` }
      : { text: match, href: match.startsWith('http') ? match : `https://${match}`, external: true })
    last = m.index + match.length
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts
}

async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

// Follow the conversation as messages arrive and type out
watch(
  () => [messages.value.length, messages.value[messages.value.length - 1]?.text, followUps.value.length, thinking.value],
  scrollToBottom,
)
onMounted(scrollToBottom)

// Enter that confirms an IME composition (e.g. Japanese input) shouldn't also send
function onEnter(e: KeyboardEvent) {
  if (!e.isComposing) send(e)
}
</script>

<style scoped>
/* Fills whatever is left of its card or popup below the header */
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chat-panel:focus {
  outline: none;   /* focus parks here after a chip; the controls inside show their own focus rings */
}

/* ── Messages ── */
.messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.2rem 1rem;
  scrollbar-width: thin;
  scrollbar-color: var(--color-line-strong) transparent;
}

.message {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}
.message.is-user {
  flex-direction: row-reverse;
}
.message.thinking {
  margin-top: 0.25rem;
}

.avatar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 50%;
  margin-bottom: 0.1rem;
  background-color: color-mix(in srgb, var(--color-snow) 5%, transparent);
}
.thinking .avatar {
  margin-bottom: 0;
}
.avatar-icon {
  width: 1.4rem;
  height: 1.4rem;
  color: var(--color-amber);
}

.bubble {
  max-width: 78%;
  padding: 0.7rem 1rem;
  border-radius: 1.2rem;
  font-size: 1.5rem;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
.typing {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.75rem 1rem;
  border-radius: 1.2rem;
}

/* Each side's bubble has one squared-off corner, pointing at its speaker */
.bubble.from-user {
  border-bottom-right-radius: 0.25rem;
  background-color: var(--color-amber);
  color: var(--color-ink);
  font-weight: 500;
}
.bubble.from-assistant,
.typing {
  border: 1px solid color-mix(in srgb, var(--color-snow) 7%, transparent);
  border-bottom-left-radius: 0.25rem;
  background-color: color-mix(in srgb, var(--color-snow) 9%, transparent);
  color: var(--color-snow);
}

/* Chips line up with the bubbles, past the avatar */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-top: 0.25rem;
  padding-left: calc(2.8rem + 0.8rem);
}

/* ── AI model status ── */
.model-status {
  flex-shrink: 0;
  padding: 0.9rem 1rem;
  border-top: 1px solid color-mix(in srgb, var(--color-snow) 6%, transparent);
}

.status-text {
  font-size: 1.3rem;
}

.model-offer {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.offer-text {
  flex: 1;
  line-height: 1.5;
  color: var(--color-mist);
}
.load-btn {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  font-size: var(--text-sm);
  line-height: var(--leading-sm);
}

.model-loading {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.progress-label {
  flex: 1;
  color: var(--color-mist);
}
.progress-value {
  font-weight: 600;
  color: var(--color-amber);
}
.progress-track {
  width: 100%;
}
.is-paused .progress-bar {
  opacity: 0.45;
}
.pause-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  padding: 0.3rem 0.8rem;
  border: 1px solid var(--color-line-strong);
  border-radius: 0.6rem;
  color: var(--color-mist);
  font-size: 1.2rem;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
}
.pause-btn:hover {
  color: var(--color-amber);
  border-color: var(--color-amber);
}
.pause-icon {
  width: 1.2rem;
  height: 1.2rem;
}

.model-error {
  line-height: 1.5;
  color: var(--color-ash);
}
.retry-btn {
  padding: 0;
  color: var(--color-amber);
  text-decoration: underline;
  cursor: pointer;
}

/* ── Input area ── */
.composer {
  flex-shrink: 0;
  width: 100%;
  padding: 0.8rem 1rem;
  border-top: 1px solid color-mix(in srgb, var(--color-snow) 6%, transparent);
  background-color: color-mix(in srgb, var(--color-snow) 2%, transparent);
}

.chat-input {
  display: block;
  width: 100%;
  height: 4.4rem;
  margin-bottom: 0.6rem;
  padding: 0.75rem 1rem;
  border: 1px solid color-mix(in srgb, var(--color-snow) 10%, transparent);
  border-radius: 0.75rem;
  background-color: color-mix(in srgb, var(--color-snow) 6%, transparent);
  color: var(--color-snow);
  font-size: 1.4rem;
  transition: border-color 0.2s ease;
}
.chat-input::placeholder {
  color: var(--color-ash);
}
.chat-input:focus {
  border-color: var(--color-amber);
}
.chat-input:disabled {
  opacity: 0.5;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.char-count {
  font-size: var(--text-base);
  line-height: var(--leading-base);
  color: var(--color-ash);
}
.composer-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.4rem;
  padding: 0;
  color: var(--color-ash);
  font-size: var(--text-base);
  line-height: var(--leading-base);
  cursor: pointer;
  transition: color 0.2s ease;
}
.clear-btn:hover:not(:disabled) {
  color: var(--color-amber);
}
.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bubble-link {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.clear-icon {
  width: 1.4rem;
  height: 1.4rem;
}

.send-btn {
  padding: 0.4rem 1.2rem;
  font-size: var(--text-base);
  line-height: var(--leading-base);
}
.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Full-page section: roomier type */
.is-large .bubble {
  font-size: 1.6rem;
  max-width: 72%;
}
.is-large .status-text {
  font-size: 1.4rem;
}
.is-large .chat-input {
  height: 4.8rem;
  font-size: 1.5rem;
}
.is-large .topic-chip {
  font-size: 1.35rem;
}

/* ── "Play a game while you wait" ── */
.play-hint {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 0.4rem;
  font: inherit;
  font-size: 1.3rem;
  font-weight: 500;
  color: var(--color-amber);
  background: color-mix(in srgb, var(--color-amber) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-amber) 35%, transparent);
  border-radius: 2rem;
  padding: 0.5rem 1.2rem;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.play-hint:hover {
  background: color-mix(in srgb, var(--color-amber) 18%, transparent);
  border-color: var(--color-amber);
}
.play-hint-icon {
  width: 1.6rem;
  height: 1.6rem;
}
.hint-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.hint-enter-from { opacity: 0; transform: translateY(0.4rem); }

/* ── Follow-up topic chips ── */
.topic-chip {
  font: inherit;
  font-size: 1.25rem;
  line-height: 1.3;
  color: var(--color-amber);
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--color-amber) 40%, transparent);
  border-radius: 2rem;
  padding: 0.45rem 1rem;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.topic-chip:hover {
  background: color-mix(in srgb, var(--color-amber) 10%, transparent);
  border-color: var(--color-amber);
}

/* ── Typing dots ── */
.dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--color-ash);
  animation: typing-bounce 1.2s ease-in-out infinite;
}
.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0);       opacity: 0.4; }
  30%            { transform: translateY(-0.35rem); opacity: 1; }
}
</style>
