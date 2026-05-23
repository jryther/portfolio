<template>
  <!-- Only render the entire widget if WebGPU is supported -->
  <div
    v-if="webGpuSupported"
    class="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-3 pointer-events-none max-xs:bottom-4 max-xs:right-4"
  >
    <!-- Floating toggle button -->
    <button
      class="pointer-events-auto w-[5.6rem] h-[5.6rem] rounded-full bg-amber border-none cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center justify-center transition-[background,transform] duration-200 flex-shrink-0 hover:bg-golden hover:scale-[1.08]"
      aria-label="Ask about Josh (AI)"
      title="Ask about Josh"
      @click="toggleModal"
    >
      <span class="text-[2.2rem] leading-none">🤖</span>
    </button>

    <!-- Modal panel -->
    <Transition name="chat-panel">
      <div
        v-if="isOpen"
        class="pointer-events-auto absolute bottom-0 right-0 w-[38rem] min-h-[46rem] max-h-[56rem] bg-panel border border-white/[.08] rounded-[1.2rem] flex flex-col overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.6)] z-[1] max-xs:w-[calc(100vw-2rem)] max-xs:max-h-[70vh]"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-[1.2rem] py-4 bg-white/[.04] border-b border-white/[.06] font-semibold text-sm text-[#f0f0f0] flex-shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-amber">🤖</span>
            <span class="ml-2">Ask About Josh</span>
          </div>
          <button
            class="bg-transparent border-none text-smoke text-base cursor-pointer leading-none py-[0.2rem] px-[0.4rem] rounded transition-[color,background] duration-200 hover:text-snow hover:bg-white/[.06]"
            aria-label="Close chat"
            @click="toggleModal"
          >
            ✕
          </button>
        </div>

        <!-- Pre-load CTA -->
        <div
          v-if="!modelStarted"
          class="flex-1 flex flex-col items-center justify-center gap-[1.8rem] px-10 py-10 text-center"
        >
          <div class="text-[4rem] leading-none opacity-85">
            🤖
          </div>
          <div class="flex flex-col gap-4">
            <p class="text-lg font-bold text-[#f0f0f0] m-0">
              AI-Powered Q&amp;A
            </p>
            <p class="text-[1.15rem] text-[#bbb] leading-[1.7] m-0">
              Ask anything about Josh's skills, experience, or background.
              The AI model runs entirely in your browser — no data leaves your device.
            </p>
            <div class="flex flex-wrap justify-center gap-[0.6rem] mt-2">
              <span class="meta-badge">~740 MB</span>
              <span class="meta-badge">First load ~30s</span>
              <span class="meta-badge">Cached after first visit</span>
            </div>
          </div>
          <div class="w-full h-px bg-white/[.06]" />
          <button
            class="button w-full py-[0.95rem] px-6 text-sm text-center justify-center"
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
            <p class="text-lg font-bold text-[#f0f0f0] m-0">
              Loading AI Model…
            </p>
            <p class="text-[1.15rem] text-[#bbb] leading-[1.7] m-0">
              {{ loadingText }}
            </p>
          </div>
          <!-- Loading bar -->
          <div class="w-full flex flex-col gap-[0.6rem]">
            <div class="w-full h-[0.55rem] bg-white/[.08] rounded-full overflow-hidden">
              <div
                class="h-full bg-amber rounded-full transition-[width] duration-[350ms] ease-out"
                :style="{ width: loadingProgress + '%' }"
              />
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs font-semibold text-amber">{{ Math.round(loadingProgress) }}%</span>
              <span class="text-[0.85rem] text-[#666]">Cached after first load</span>
            </div>
          </div>
          <div class="w-full h-px bg-white/[.06]" />
          <div class="flex flex-wrap justify-center gap-[0.6rem]">
            <span class="meta-badge">~740 MB</span>
            <span class="meta-badge">One-time download</span>
            <span class="meta-badge">Runs in your browser</span>
          </div>
          <div class="text-[1.05rem] text-ember bg-amber/[.07] border border-amber/20 rounded-[0.6rem] py-3 px-[1.1rem] leading-[1.65] text-center w-full box-border">
            ⚠️ Site performance may be reduced while the model is loading. This is temporary and will resolve once loading is complete.
          </div>
        </div>

        <!-- Chat messages -->
        <div
          v-else
          ref="messagesEl"
          class="flex-1 overflow-y-auto px-4 py-[1.2rem] flex flex-col gap-2"
          style="scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.1) transparent"
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
                class="text-[1.3rem] flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/[.05] rounded-full mb-[0.1rem]"
              >
                🤖
              </div>
              <div
                class="max-w-[72%] py-[0.7rem] px-4 text-[1.05rem] leading-[1.55] whitespace-pre-wrap break-words rounded-[1.2rem]"
                :class="msg.role === 'user'
                  ? 'bg-amber text-ink font-medium rounded-br-[0.25rem]'
                  : 'bg-white/[.09] text-[#ddd] rounded-bl-[0.25rem] border border-white/[.07]'"
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
            <div class="text-[1.3rem] flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/[.05] rounded-full">
              🤖
            </div>
            <div class="flex items-center gap-[0.35rem] bg-white/[.09] border border-white/[.07] rounded-[1.2rem] rounded-bl-[0.25rem] py-3 px-4">
              <span class="dot" />
              <span class="dot" />
              <span class="dot" />
            </div>
          </div>

        </div>

        <!-- Input area -->
        <div
          v-if="modelReady"
          class="px-4 py-[0.8rem] border-t border-white/[.06] bg-white/[.02] flex-shrink-0 box-border w-full"
        >
          <input
            v-model="userInput"
            placeholder="Ask about Josh..."
            :disabled="thinking"
            maxlength="400"
            class="block w-full box-border bg-white/[.06] border border-white/10 rounded-[0.75rem] py-3 px-4 text-[#eee] text-[1.1rem] font-[inherit] outline-none transition-[border-color] duration-200 h-20 resize-none mb-[0.6rem] focus:border-amber disabled:opacity-50 placeholder:text-[#555]"
            @keydown.enter="sendMessage"
          >
          <div class="flex items-center justify-between">
            <p class="text-[0.85rem] text-smoke m-0">
              {{ userInput.length }}/400
            </p>
            <div class="flex items-center gap-3">
              <button
                class="bg-transparent border-none text-[#666] text-[0.85rem] cursor-pointer p-0 transition-colors duration-200 hover:text-amber font-[inherit]"
                @click="clearChat"
              >
                ↺ Clear
              </button>
              <button
                :disabled="thinking || !userInput.trim()"
                class="button py-[0.4rem] px-[1.2rem] text-xs disabled:opacity-40 disabled:cursor-not-allowed"
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
import { ref, nextTick, onMounted } from 'vue'
import { loadModel, warmupModel, askQuestion, clearHistory } from '../../services/webllm'
import resumeContext from '../../data/resumeContext'

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

onMounted(async () => {
  // Check that WebGPU is available AND that a real adapter can be obtained
  if (!navigator.gpu) return
  const adapter = await navigator.gpu.requestAdapter()
  webGpuSupported.value = !!adapter
})

function toggleModal() {
  isOpen.value = !isOpen.value
}

async function startChat() {
  modelStarted.value = true
  try {
    await loadModel((progress, text) => {
      loadingProgress.value = Math.round(progress * 100)
      if (text) loadingText.value = text
    })
    loadingText.value = 'Warming up…'
    await warmupModel(resumeContext)
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
/* ── Meta badge (shared) ── */
.meta-badge {
  font-size: 0.9rem;
  color: #999;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
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
  background: #888;
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
