<template>
  <!-- Only render the entire widget if WebGPU is supported -->
  <div
    v-if="webGpuSupported"
    class="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-3 pointer-events-none max-xs:bottom-4 max-xs:right-4"
  >
    <!-- Floating toggle button -->
    <button
      class="pointer-events-auto w-[5.6rem] h-[5.6rem] rounded-2xl bg-amber border border-golden/40 cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.3),0_0_0_6px_color-mix(in_srgb,var(--color-amber)_10%,transparent)] flex items-center justify-center transition-[background,transform] duration-200 flex-shrink-0 hover:bg-golden"
      aria-label="Ask about Josh (AI)"
      title="Ask about Josh"
      @click="toggleModal"
    >
      <SparkleIcon class="w-[2.4rem] h-[2.4rem] text-ink" />
    </button>

    <!-- Modal panel -->
    <Transition name="chat-panel">
      <div
        v-if="isOpen"
        class="pointer-events-auto absolute bottom-0 right-0 bg-panel border border-line-strong rounded-[1.4rem] flex flex-col overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.35)] z-[1] max-xs:w-[calc(100vw-2rem)] max-xs:max-h-[70vh]"
        :style="modalStyle"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-[1.2rem] py-5 bg-snow/[.04] border-b border-snow/[.06] font-semibold text-lg text-snow flex-shrink-0">
          <div class="flex items-center gap-3">
            <SparkleIcon class="w-[1.8rem] h-[1.8rem] text-amber" />
            <span class="ml-1 text-lg">Ask About Josh</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="modelStarted"
              class="bg-transparent border-none cursor-pointer flex items-center gap-[0.35rem] px-3 h-8 rounded-full text-base font-medium transition-[color,background] duration-200"
              :class="[
                showGame
                  ? 'text-amber bg-amber/[.15] ring-1 ring-amber/50'
                  : 'text-ash hover:text-snow hover:bg-snow/[.06]',
                !modelReady && !showGame ? 'btn-loading-glow' : ''
              ]"
              :title="showGame ? 'Back to chat' : 'Play a game'"
              @click="toggleGame"
            >
              <span
                class="text-[1.6rem] inline-block"
                :class="{ 'controller-jiggle': !modelReady && !showGame }"
              >🎮</span>
              <span class="font-semibold">{{ showGame ? 'Exit' : 'Game' }}</span>
            </button>
            <button
              class="bg-transparent border-none text-smoke text-[1.6rem] cursor-pointer leading-none w-9 h-9 flex items-center justify-center rounded transition-[color,background] duration-200 hover:text-snow hover:bg-snow/[.06]"
              aria-label="Close chat"
              @click="toggleModal"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Mini-game (replaces content area when active) -->
        <MiniGame
          v-if="showGame && modelStarted"
          :loading-progress="loadingProgress"
          :loading-text="loadingText"
          :model-ready="modelReady"
          :expanded="expanded"
          class="force-dark flex-1 min-h-0"
          @close="showGame = false"
          @continue-to-chat="showGame = false"
          @toggle-expand="expanded = !expanded"
        />

        <!-- Pre-load CTA -->
        <div
          v-else-if="!modelStarted"
          class="flex-1 flex flex-col items-center justify-center gap-[1.8rem] px-10 py-10 text-center"
        >
          <div class="text-[4rem] leading-none opacity-85">
            <SparkleIcon class="w-[4.4rem] h-[4.4rem] text-amber" />
          </div>
          <div class="flex flex-col gap-4">
            <p class="text-lg font-bold text-snow m-0">
              AI-Powered Q&amp;A
            </p>
            <p class="text-mist text-md mb-4 leading-[1.7]">
              Ask anything about Josh's skills, experience, or background.
              The AI model runs entirely in your browser — no data leaves your device.
            </p>
            <div class="flex flex-wrap justify-center gap-[0.6rem] mt-2">
              <span class="meta-badge text-md">~740 MB</span>
              <span class="meta-badge">First load ~30s</span>
              <span class="meta-badge">Cached after first visit</span>
            </div>
          </div>
          <div class="w-full h-px bg-snow/[.06]" />
          <button
            class="button w-full py-[0.95rem] px-6 text-md text-center justify-center"
            @click="startChat"
          >
            Start Chat
          </button>
        </div>

        <!-- Loading progress -->
        <div
          v-else-if="!modelReady"
          class="flex-1 flex flex-col items-center justify-center gap-[1.8rem] px-10 py-10 text-center"
        >
          <div class="text-[4rem] leading-none opacity-85 spin-gear">
            ⚙️
          </div>
          <div class="flex flex-col gap-4">
            <p class="text-lg font-bold text-snow m-0">
              Loading AI Model…
            </p>
            <!-- Progress text swaps to shader warning while compiling -->
            <div
              v-if="isCompilingShaders"
              class="text-base font-semibold text-snow bg-amber/[.18] border border-amber/40 rounded-[0.6rem] py-3 px-[1.1rem] leading-[1.65] text-center w-full box-border"
            >
              🖥️ Compiling GPU shaders — browser may freeze briefly. This is normal.
            </div>
            <p
              v-else
              class="text-[1.15rem] text-mist leading-[1.7] m-0"
            >
              {{ loadingText }}
            </p>
          </div>
          <!-- Loading bar -->
          <div class="w-full flex flex-col gap-[0.6rem]">
            <div class="w-full h-[0.55rem] bg-snow/[.08] rounded-full overflow-hidden">
              <div
                class="h-full bg-amber rounded-full transition-[width] duration-[350ms] ease-out"
                :style="{ width: loadingProgress + '%' }"
              />
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base font-semibold text-amber">{{ Math.round(loadingProgress) }}%</span>
              <span class="text-base text-ash">Cached after first load</span>
            </div>
          </div>
          <div class="w-full h-px bg-snow/[.06]" />
          <div class="flex flex-wrap justify-center gap-[0.6rem]">
            <span class="meta-badge">~740 MB</span>
            <span class="meta-badge">One-time download</span>
            <span class="meta-badge">Runs in your browser</span>
          </div>
          <!-- Static performance warning — always visible during loading -->
          <div class="text-base text-ember bg-amber/[.07] border border-amber/20 rounded-[0.6rem] py-3 px-[1.1rem] leading-[1.65] text-center w-full box-border">
            ⚠️ Site performance may be reduced while the model is loading. This is temporary and will resolve once loading is complete.
          </div>
        </div>

        <!-- Chat messages -->
        <div
          v-else
          ref="messagesEl"
          class="flex-1 overflow-y-auto px-4 py-[1.2rem] flex flex-col gap-2"
          style="scrollbar-width:thin; scrollbar-color:var(--color-line-strong) transparent"
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
                class="text-[1.3rem] flex-shrink-0 w-8 h-8 flex items-center justify-center bg-snow/[.05] rounded-full mb-[0.1rem]"
              >
                <SparkleIcon class="w-[1.4rem] h-[1.4rem] text-amber" />
              </div>
              <div
                class="max-w-[72%] py-[0.7rem] px-4 text-base leading-[1.55] whitespace-pre-wrap break-words rounded-[1.2rem]"
                :class="msg.role === 'user'
                  ? 'bg-amber text-ink font-medium rounded-br-[0.25rem]'
                  : 'bg-snow/[.09] text-snow rounded-bl-[0.25rem] border border-snow/[.07]'"
              >
                {{ msg.text }}
              </div>
            </div>
          </template>

          <!-- Thinking indicator -->
          <div
            v-if="thinking && messages[messages.length - 1]?.text === ''"
            class="flex items-end gap-2 mt-1"
          >
            <div class="text-[1.3rem] flex-shrink-0 w-8 h-8 flex items-center justify-center bg-snow/[.05] rounded-full">
              <SparkleIcon class="w-[1.4rem] h-[1.4rem] text-amber" />
            </div>
            <div class="flex items-center gap-[0.35rem] bg-snow/[.09] border border-snow/[.07] rounded-[1.2rem] rounded-bl-[0.25rem] py-3 px-4">
              <span class="dot" />
              <span class="dot" />
              <span class="dot" />
            </div>
          </div>
        </div>

        <!-- Input area -->
        <div
          v-if="modelReady && !showGame"
          class="px-4 py-[0.8rem] border-t border-snow/[.06] bg-snow/[.02] flex-shrink-0 box-border w-full"
        >
          <input
            v-model="userInput"
            placeholder="Ask about Josh..."
            :disabled="thinking"
            maxlength="400"
            class="block w-full box-border bg-snow/[.06] border border-snow/10 rounded-[0.75rem] py-3 px-4 text-snow text-[1.1rem] font-[inherit] outline-none transition-[border-color] duration-200 h-20 resize-none mb-[0.6rem] focus:border-amber disabled:opacity-50 placeholder:text-smoke"
            @keydown.enter="sendMessage"
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
                :disabled="thinking || !userInput.trim()"
                class="button py-[0.4rem] px-[1.2rem] text-base disabled:opacity-40 disabled:cursor-not-allowed"
                @click="sendMessage"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue'
import { loadModel, warmupModel, askQuestion, clearHistory } from '../../services/webllm'
import resumeContext from '../../data/resumeContext'
import MiniGame from './MiniGame.vue'
import SparkleIcon from '../icons/SparkleIcon.vue'
import { gameActive, shaderCompiling } from '../../composables/useAiState'

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

const webGpuSupported  = ref<boolean>(false)
const isOpen           = ref<boolean>(false)
const modelStarted     = ref<boolean>(false)
const modelReady       = ref<boolean>(false)
const loadingText      = ref<string>('Downloading model… this only happens once.')
const loadingProgress  = ref<number>(0)
const messages         = ref<ChatMessage[]>([])
const userInput        = ref<string>('')
const thinking         = ref<boolean>(false)
const messagesEl       = ref<HTMLElement | null>(null)
const showGame         = ref<boolean>(false)
const expanded         = ref<boolean>(false)

// True from the moment download completes until shaders are done — set early so
// Vue can paint the warning BEFORE the GPU freeze begins
const isCompilingShaders = computed(() => shaderCompiling.value)

const modalStyle = computed(() => ({
  width:     expanded.value ? 'min(76rem, 95vw)' : '44rem',
  minHeight: expanded.value ? '70vh'             : '46rem',
  maxHeight: expanded.value ? '92vh'             : '56rem',
  transition: 'width 0.35s ease, min-height 0.35s ease, max-height 0.35s ease',
}))

onMounted(async () => {
  // Check that WebGPU is available AND that a real adapter can be obtained
  if (!navigator.gpu) return
  const adapter = await navigator.gpu.requestAdapter()
  webGpuSupported.value = !!adapter
})

function toggleGame() {
  showGame.value = !showGame.value
  gameActive.value = showGame.value
  if (!showGame.value) expanded.value = false
}

// Also clear gameActive when modal closes
function toggleModal() {
  isOpen.value = !isOpen.value
  if (!isOpen.value) gameActive.value = false
}

async function startChat() {
  modelStarted.value = true
  try {
    await loadModel((progress, text) => {
      // When cache loading hits 100%, shaders are next — set the flag NOW
      // so Vue can paint the warning before the GPU freeze begins
      if (progress >= 1 && !shaderCompiling.value) {
        shaderCompiling.value = true
      }
      loadingProgress.value = Math.round(progress * 100)
      if (text) loadingText.value = text
    })
    loadingText.value = 'Warming up…'
    // Keep shaderCompiling true through warmup so the overlay stays visible on
    // Chromium (deferred GPU sync fires at first pipeline use during prefill).
    await warmupModel(resumeContext, gameActive.value)
    shaderCompiling.value = false
    modelReady.value = true
    messages.value.push({
      role: 'assistant',
      text: "Hi! I'm Josh's AI assistant. Ask me anything about his background, skills, projects, or experience.",
    })
    await scrollToBottom()
  } catch (e) {
    loadingText.value = '⚠️ Failed to load model. Please refresh and try again.'
    console.error('[WebLLM]', e)
  }
}

async function sendMessage() {
  const question = userInput.value.trim()
  if (!question || thinking.value) return

  userInput.value = ''
  messages.value.push({ role: 'user', text: question })
  thinking.value = true
  await scrollToBottom()

  // Push an empty assistant message that we'll stream tokens into
  messages.value.push({ role: 'assistant', text: '' })
  const liveIndex = messages.value.length - 1

  try {
    await askQuestion(question, resumeContext, (chunk) => {
      messages.value[liveIndex].text += chunk
      scrollToBottom()
    })
  } catch (e) {
    messages.value[liveIndex].text = 'Something went wrong. Please try again.'
    console.error('[WebLLM]', e)
  } finally {
    thinking.value = false
    await scrollToBottom()
  }
}

function clearChat() {
  messages.value = []
  clearHistory()
}

async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}
</script>

<style scoped>
/* ── Shader freeze banner swap transition ── */
.freeze-banner-enter-active,
.freeze-banner-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.freeze-banner-enter-from,
.freeze-banner-leave-to {
  opacity: 0;
  transform: translateY(0.25rem);
}

/* ── Game button: jiggle + glow while model is loading ── */
@keyframes controller-jiggle {
  /* Continuous pendulum swing so there's always visible motion */
  0%, 100% { transform: rotate(-14deg) translateY(-2px); }
  50%      { transform: rotate(14deg)  translateY(-2px); }
}
.controller-jiggle {
  animation: controller-jiggle 0.75s ease-in-out infinite;
  display: inline-block;
  transform-origin: center 60%;
}

@keyframes btn-glow-pulse {
  0%, 100% { box-shadow: 0 0 0px  0px rgba(245,166,35,0);    }
  50%      { box-shadow: 0 0 16px 6px rgba(245,166,35,0.55); }
}
.btn-loading-glow {
  animation: btn-glow-pulse 1.6s ease-in-out infinite;
}

/* ── Meta badge (shared) ── */
.meta-badge {
  font-size: 1.2rem;
  color: var(--color-ash);
  background: color-mix(in srgb, var(--color-snow) 5%, transparent);
  border: 1px solid var(--color-line-strong);
  border-radius: 2rem;
  padding: 0.3rem 0.9rem;
}

/* ── Spinning gear ── */
.spin-gear {
  animation: spin-gear 2s linear infinite;
  display: inline-block;
}
@keyframes spin-gear {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
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

/* ── Panel slide-up transition ── */
.chat-panel-enter-active,
.chat-panel-leave-active {
  transition: opacity 0.25s ease, transform 0.28s ease;
}
.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(1.5rem) scale(0.97);
}
</style>
