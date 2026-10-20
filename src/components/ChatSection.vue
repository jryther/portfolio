<template>
  <section
    id="chat"
    ref="sectionEl"
    class="section chat-section"
  >
    <div class="wrap chat-layout">
      <!-- Heading -->
      <div
        class="chat-intro"
        data-aos="fade-up"
      >
        <p class="eyebrow">
          05 — Ask
        </p>
        <h2 class="section-title mt-6 mb-6">
          Ask about my work
        </h2>
        <p class="text-body leading-[1.8] text-mist">
          Ask about my experience, projects, or skills and get an answer straight away, or pick a topic to explore.
        </p>
      </div>

      <!-- Chat -->
      <div
        ref="chatCardEl"
        class="chat-card"
        role="region"
        aria-label="Chat about Josh"
        data-aos="fade-up"
        data-aos-delay="80"
      >
        <div class="flex items-center justify-between gap-4 px-[1.6rem] py-[1.2rem] bg-snow/[.04] border-b border-snow/[.06] flex-shrink-0">
          <div class="flex items-center gap-3 text-snow font-semibold text-lg">
            <SparkleIcon class="w-[1.8rem] h-[1.8rem] text-amber" />
            Ask About Josh
          </div>
          <div class="flex items-center gap-3">
            <span
              class="status-pill"
              :class="{ 'is-ready': modelReady }"
            >
              <span class="status-dot" />
              {{ statusLabel }}
            </span>
            <button
              class="header-btn"
              :class="{ 'is-active': showGame, 'is-hinting': slowLoad && !showGame }"
              :aria-pressed="showGame"
              :aria-label="showGame ? 'Back to chat' : slowLoad ? 'Play a game while the AI loads' : 'Play a game'"
              :title="showGame ? 'Back to chat' : slowLoad ? 'Play a game while the AI loads' : 'Play a game'"
              @click="showGame = !showGame"
            >
              <UiIcon name="game" />
              <span
                v-if="slowLoad && !showGame"
                class="hint-dot"
              />
            </button>
          </div>
        </div>
        <MiniGame
          v-if="showGame"
          class="flex-1"
        />
        <ChatPanel
          v-else
          large
          class="flex-1"
          @play-game="showGame = true"
        />
      </div>

      <!-- How it works -->
      <div
        class="chat-details"
        data-aos="fade-up"
        data-aos-delay="120"
      >
        <h3 class="detail-heading">
          How it works
        </h3>
        <ol class="steps">
          <li>
            <span class="step-num">1</span>
            <p><strong>Every answer is written ahead of time</strong> from my career notes, so the chat never makes anything up.</p>
          </li>
          <li>
            <span class="step-num">2</span>
            <p><strong>Clear questions match instantly</strong> by keyword, and topic buttons jump straight to an answer. No download needed.</p>
          </li>
          <li>
            <span class="step-num">3</span>
            <p><strong>For questions in your own words</strong>, a small AI model running in your browser finds the answer closest in meaning.</p>
          </li>
        </ol>

        <h3 class="detail-heading mt-12">
          Try asking in your own words
        </h3>
        <div class="flex flex-col items-start gap-3">
          <button
            v-for="q in AI_EXAMPLES"
            :key="q"
            class="example"
            @click="fillInput(q)"
          >
            “{{ q }}”
          </button>
        </div>
        <p
          v-if="!modelReady"
          class="text-sm text-ash mt-4"
        >
          Tip: load the AI model in the chat first, so it understands questions like these.
        </p>

        <h3 class="detail-heading mt-12">
          Under the hood
        </h3>
        <dl class="facts">
          <div>
            <dt>Model</dt>
            <dd>{{ MODEL.name }}, {{ MODEL.sizeLabel }}, cached after the first visit</dd>
          </div>
          <div>
            <dt>Runs on</dt>
            <dd>Your CPU through wllama. No GPU needed</dd>
          </div>
          <div>
            <dt>Privacy</dt>
            <dd>Everything runs in your browser. Nothing you type leaves your device</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import SparkleIcon from './icons/SparkleIcon.vue'
import ChatPanel from './AiChat/ChatPanel.vue'
import UiIcon from './icons/UiIcon.vue'
import { AI_EXAMPLES } from '../data/chatTree'
import { MODEL } from '../services/chatModel'
import { prefetchWhenIdle } from '../composables/useGame'
import {
  openChat, chatSectionInView, modelStatus, modelReady, loadingProgress, userInput, slowLoad,
} from '../composables/useChat'

// The game's code downloads in the background once the section is in view, so the game icon is instant
const loadGame = () => import('./AiChat/MiniGame.vue')
const MiniGame = defineAsyncComponent(loadGame)

const sectionEl  = ref<HTMLElement | null>(null)
const chatCardEl = ref<HTMLElement | null>(null)
const showGame   = ref<boolean>(false)


// Put an example in the chat box (replacing whatever was there) for the visitor to send
async function fillInput(question: string) {
  showGame.value = false
  userInput.value = question
  await nextTick()
  const input = chatCardEl.value?.querySelector('input')
  if (input && !input.disabled) {
    input.focus()
    input.setSelectionRange(question.length, question.length)
  }
}

const statusLabel = computed(() => {
  if (modelStatus.value === 'ready') return 'AI ready'
  if (modelStatus.value === 'loading') return `Loading AI · ${loadingProgress.value}%`
  return 'Quick answers'
})

let observer: IntersectionObserver | null = null

onMounted(() => {
  // "In view" = the section covers the middle band of the screen. That's when the floating
  // chat button steps aside, and the first time it greets the visitor
  observer = new IntersectionObserver(([entry]) => {
    chatSectionInView.value = entry.isIntersecting
    if (entry.isIntersecting) {
      openChat()
      prefetchWhenIdle(loadGame)
    }
  }, { rootMargin: '-35% 0px -35% 0px' })
  if (sectionEl.value) observer.observe(sectionEl.value)
})

onUnmounted(() => {
  observer?.disconnect()
  chatSectionInView.value = false
})
</script>

<style scoped>
/* Phones: heading, chat, details. Desktop: heading + details on the left, chat on the right */
.chat-layout {
  display: grid;
  gap: 4rem;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: "intro" "chat" "details";
}
.chat-intro   { grid-area: intro; }
.chat-card    { grid-area: chat; }
.chat-details { grid-area: details; }

@media (min-width: 1024px) {
  /* Landing here from the nav (scroll-padding-top: 8rem) should show the whole chat */
  .chat-section {
    padding-top: 3.2rem;
  }
  .chat-card {
    height: clamp(52rem, calc(100svh - 8rem - 3.2rem - 2.4rem), 80rem);
  }
  .chat-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.55fr);
    grid-template-rows: auto 1fr;
    grid-template-areas: "intro chat" "details chat";
    column-gap: 6.4rem;
    row-gap: 4rem;
  }
}

.chat-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: min(76rem, calc(100svh - 12rem));
  min-height: 52rem;
  background: var(--color-panel);
  border: 1px solid var(--color-line-strong);
  border-radius: 1.4rem;
  box-shadow: 0 8px 40px rgb(0 0 0 / 0.18);
}

.header-btn {
  width: 3.4rem;
  height: 3.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.8rem;
  background: transparent;
  color: var(--color-ash);
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}
.header-btn:hover {
  color: var(--color-snow);
  background: color-mix(in srgb, var(--color-snow) 6%, transparent);
}
.header-btn.is-active {
  color: var(--color-amber);
  background: color-mix(in srgb, var(--color-amber) 12%, transparent);
}
.header-btn {
  position: relative;
}
/* The AI is still loading: point at the game */
.header-btn.is-hinting {
  color: var(--color-amber);
  animation: hint-pulse 1.8s ease-out infinite;
}
.hint-dot {
  position: absolute;
  top: 0.45rem;
  right: 0.45rem;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: var(--color-amber);
  box-shadow: 0 0 0 2px var(--color-panel);
}
@keyframes hint-pulse {
  0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-amber) 45%, transparent); }
  70%  { box-shadow: 0 0 0 0.8rem color-mix(in srgb, var(--color-amber) 0%, transparent); }
  100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-amber) 0%, transparent); }
}
@media (prefers-reduced-motion: reduce) {
  .header-btn.is-hinting { animation: none; }
}
.header-btn svg {
  width: 1.9rem;
  height: 1.9rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-mono);
  font-size: 1.15rem;
  color: var(--color-ash);
  border: 1px solid var(--color-line-strong);
  border-radius: 2rem;
  padding: 0.3rem 0.9rem;
  white-space: nowrap;
}
.status-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--color-smoke);
}
.status-pill.is-ready { color: var(--color-moss); }
.status-pill.is-ready .status-dot { background: var(--color-moss); }

.detail-heading {
  font-family: var(--font-mono);
  font-size: 1.2rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ash);
  margin-bottom: 1.8rem;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  list-style: none;
  padding: 0;
  margin: 0;
}
.steps li {
  display: flex;
  gap: 1.4rem;
  align-items: flex-start;
}
.steps p {
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.65;
  color: var(--color-mist);
}
.steps strong {
  color: var(--color-snow);
  font-weight: 600;
}
.step-num {
  flex-shrink: 0;
  width: 2.6rem;
  height: 2.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--color-amber) 45%, transparent);
  color: var(--color-amber);
  font-family: var(--font-mono);
  font-size: 1.2rem;
  margin-top: 0.1rem;
}

.example {
  font: inherit;
  font-size: 1.4rem;
  line-height: 1.45;
  text-align: left;
  color: var(--color-snow);
  background: color-mix(in srgb, var(--color-snow) 4%, transparent);
  border: 1px solid var(--color-line);
  border-radius: 1rem;
  padding: 0.9rem 1.3rem;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}
.example:hover {
  border-color: var(--color-amber);
  color: var(--color-amber);
}

.facts {
  display: grid;
  gap: 1.2rem;
  margin: 0;
}
.facts div {
  display: grid;
  grid-template-columns: 8.4rem minmax(0, 1fr);
  gap: 1.2rem;
}
.facts dt {
  font-family: var(--font-mono);
  font-size: 1.2rem;
  color: var(--color-ash);
  padding-top: 0.2rem;
}
.facts dd {
  margin: 0;
  font-size: 1.4rem;
  line-height: 1.55;
  color: var(--color-mist);
}
</style>
