<template>
  <div
    class="chat-panel flex flex-col min-h-0"
    :class="{ 'is-large': large }"
  >
    <!-- Chat messages -->
    <div
      ref="messagesEl"
      class="flex-1 min-h-0 overflow-y-auto px-4 py-[1.2rem] flex flex-col gap-2"
      style="scrollbar-width:thin; scrollbar-color:var(--color-line-strong) transparent"
      aria-live="polite"
    >
      <template
        v-for="(msg, i) in messages"
        :key="i"
      >
        <div
          v-if="msg.text !== ''"
          class="flex items-end gap-2"
          :class="msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'"
        >
          <div
            v-if="msg.role === 'assistant'"
            class="avatar flex-shrink-0 flex items-center justify-center bg-snow/[.05] rounded-full mb-[0.1rem]"
          >
            <SparkleIcon class="w-[1.4rem] h-[1.4rem] text-amber" />
          </div>
          <div
            class="bubble max-w-[78%] py-[0.7rem] px-4 whitespace-pre-wrap break-words rounded-[1.2rem]"
            :class="msg.role === 'user'
              ? 'bg-amber text-ink font-medium rounded-br-[0.25rem]'
              : 'bg-snow/[.09] text-snow rounded-bl-[0.25rem] border border-snow/[.07]'"
          >
            {{ msg.text }}
          </div>
        </div>
      </template>

      <!-- Follow-up topics for the latest answer -->
      <div
        v-if="followUps.length"
        class="chips flex flex-wrap gap-2 pt-1"
      >
        <button
          v-for="id in followUps"
          :key="id"
          class="topic-chip"
          @click="askTopic(id)"
        >
          {{ TOPICS[id].label }}
        </button>
      </div>

      <!-- Thinking indicator -->
      <div
        v-if="thinking"
        class="flex items-end gap-2 mt-1"
        aria-label="Thinking"
      >
        <div class="avatar flex-shrink-0 flex items-center justify-center bg-snow/[.05] rounded-full">
          <SparkleIcon class="w-[1.4rem] h-[1.4rem] text-amber" />
        </div>
        <div class="flex items-center gap-[0.35rem] bg-snow/[.09] border border-snow/[.07] rounded-[1.2rem] rounded-bl-[0.25rem] py-3 px-4">
          <span class="dot" />
          <span class="dot" />
          <span class="dot" />
        </div>
      </div>
    </div>

    <!-- AI model status: optional, chips and quick answers work without it -->
    <div
      v-if="modelStatus !== 'ready'"
      class="px-4 py-[0.9rem] border-t border-snow/[.06] flex-shrink-0"
    >
      <div
        v-if="modelStatus === 'idle'"
        class="flex items-center gap-4"
      >
        <p class="status-text flex-1 m-0 text-mist leading-[1.5]">
          Want me to understand questions in your own words? Load a small AI model that runs in your browser.
        </p>
        <button
          class="button-ghost flex-shrink-0 py-[0.5rem] px-[1rem] text-sm"
          :title="`${MODEL.name}, ${MODEL.sizeLabel} one-time download`"
          @click="startModel"
        >
          Load AI · {{ MODEL.sizeLabel }}
        </button>
      </div>
      <div
        v-else-if="modelStatus === 'loading'"
        class="flex flex-col gap-[0.6rem]"
      >
        <div class="status-text flex items-center justify-between gap-3">
          <span class="text-mist">{{ loadingText }}</span>
          <span class="font-semibold text-amber">{{ loadingProgress }}%</span>
        </div>
        <div class="w-full h-[0.4rem] bg-snow/[.08] rounded-full overflow-hidden">
          <div
            class="h-full bg-amber rounded-full transition-[width] duration-[350ms] ease-out"
            :style="{ width: loadingProgress + '%' }"
          />
        </div>
      </div>
      <p
        v-else
        class="status-text m-0 text-ash leading-[1.5]"
      >
        The AI model couldn't load on this device, but quick answers still work.
        <button
          class="bg-transparent border-none p-0 text-amber cursor-pointer font-[inherit] underline"
          @click="startModel"
        >
          Try again
        </button>
      </p>
    </div>

    <!-- Input area -->
    <div class="px-4 py-[0.8rem] border-t border-snow/[.06] bg-snow/[.02] flex-shrink-0 box-border w-full">
      <!-- :value + @input rather than v-model, so phone keyboards update it mid-word -->
      <input
        :value="userInput"
        :placeholder="modelLoading ? 'Loading the AI model… pick a topic above meanwhile' : 'Ask about Josh...'"
        aria-label="Ask a question about Josh"
        :disabled="busy || modelLoading"
        maxlength="400"
        class="chat-input block w-full box-border bg-snow/[.06] border border-snow/10 rounded-[0.75rem] py-3 px-4 text-snow font-[inherit] outline-none transition-[border-color] duration-200 resize-none mb-[0.6rem] focus:border-amber disabled:opacity-50 placeholder:text-smoke"
        @input="userInput = ($event.target as HTMLInputElement).value"
        @keydown.enter="onEnter"
      >
      <div class="flex items-center justify-between">
        <p class="text-base text-smoke m-0">
          {{ userInput.length }}/400
        </p>
        <div class="flex items-center gap-3">
          <button
            class="bg-transparent border-none text-ash text-base cursor-pointer p-0 transition-colors duration-200 hover:text-amber font-[inherit]"
            @click="clearChat"
          >
            ↺ Clear
          </button>
          <button
            :disabled="busy || modelLoading"
            class="button py-[0.4rem] px-[1.2rem] text-base disabled:opacity-40 disabled:cursor-not-allowed"
            @click="sendMessage"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import SparkleIcon from '../icons/SparkleIcon.vue'
import { TOPICS } from '../../data/chatTree'
import { MODEL } from '../../services/chatModel'
import {
  messages, followUps, userInput, thinking, busy, modelStatus, modelLoading, loadingProgress, loadingText,
  startModel, sendMessage, askTopic, clearChat,
} from '../../composables/useChat'

// The conversation itself lives in useChat; this is one view of it (popup or full section)
defineProps<{ large?: boolean }>()

const messagesEl = ref<HTMLElement | null>(null)

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
  if (!e.isComposing) sendMessage()
}
</script>

<style scoped>
.avatar {
  width: 2.8rem;
  height: 2.8rem;
}
.bubble {
  font-size: 1.5rem;
  line-height: 1.55;
}
/* Chips line up with the bubbles, past the avatar */
.chips {
  padding-left: calc(2.8rem + 0.8rem);
}
.status-text {
  font-size: 1.3rem;
}
.chat-input {
  height: 4.4rem;
  font-size: 1.4rem;
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
