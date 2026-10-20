import { ref, computed } from 'vue'
import { TOPICS, WELCOME, UNKNOWN_ID } from '../data/chatTree'
import { matchKeywords, resolveReply, isConversational, type Reply } from '../services/chatRouter'

// One conversation shared by the floating popup and the full-page chat section, so a chat
// started in one carries on in the other.

// wllama (~0.5 MB of JS plus its wasm) only loads once the chat needs the model
const modelService = () => import('../services/wllama')

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

export const messages        = ref<ChatMessage[]>([])
export const followUps       = ref<string[]>([])
export const userInput       = ref<string>('')
export const thinking        = ref<boolean>(false)
export const typing          = ref<boolean>(false)
export const modelStatus     = ref<ModelStatus>('idle')
export const loadingProgress = ref<number>(0)

/** Set by ChatSection while it's on screen; the floating button steps aside then */
export const chatSectionInView = ref<boolean>(false)

export const modelReady   = computed(() => modelStatus.value === 'ready')
// Free text waits for the model once it's coming, so answers don't switch quality mid-load
export const modelLoading = computed(() => modelStatus.value === 'loading')
export const busy         = computed(() => thinking.value || typing.value)
export const loadingText  = computed(() => loadingProgress.value < 100
  ? 'Downloading AI model… this only happens once.'
  : 'Starting the AI model…')

const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Where the conversation is in the tree, so "tell me more" knows what to continue
let previousTopicId: string | null = null
const visited = new Set<string>()
let cacheChecked = false

function showWelcome() {
  messages.value = [{ role: 'assistant', text: WELCOME.text }]
  followUps.value = [...WELCOME.followUps]
}

/** Call when a chat view opens: greets once, and loads the model if it's already cached */
export function openChat() {
  if (!messages.value.length) showWelcome()
  autoLoadIfCached()
}

// A returning visitor already has the model cached, so there's no download to ask about
async function autoLoadIfCached() {
  if (cacheChecked || modelStatus.value !== 'idle') return
  cacheChecked = true
  const { isModelCached } = await modelService()
  if (await isModelCached()) startModel()
}

export async function startModel() {
  if (modelStatus.value === 'loading' || modelStatus.value === 'ready') return
  modelStatus.value = 'loading'
  loadingProgress.value = 0
  try {
    const { loadModel } = await modelService()
    await loadModel((progress) => {
      loadingProgress.value = Math.round(progress * 100)
    })
    loadingProgress.value = 100
    modelStatus.value = 'ready'
  } catch (e) {
    modelStatus.value = 'error'
    console.error('[wllama]', e)
  }
}

// Keywords answer instantly when they're clear; otherwise the model picks the topic
async function route(question: string): Promise<string> {
  const { best, confident } = matchKeywords(question)
  if (best && confident) return best.id
  if (modelReady.value) {
    try {
      const { routeWithModel } = await modelService()
      return await routeWithModel(question)
    } catch (e) {
      console.error('[wllama]', e)
    }
  }
  return best?.id ?? UNKNOWN_ID
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

async function ask(question: string, topicId?: string) {
  if (busy.value) return
  messages.value.push({ role: 'user', text: question })
  followUps.value = []
  thinking.value = true

  const started = performance.now()
  const routed = topicId ?? await route(question)
  const reply = resolveReply(routed, previousTopicId, visited)
  if (!isConversational(reply.topicId)) {
    previousTopicId = reply.topicId
    visited.add(reply.topicId)
  }

  // Instant answers still get a beat of "thinking" so the exchange reads as a conversation
  const minThinking = prefersReducedMotion ? 0 : 500
  const elapsed = performance.now() - started
  if (elapsed < minThinking) await sleep(minThinking - elapsed)

  thinking.value = false
  await typeOut(reply)
}

// Reveal the answer a few words at a time, like it's being typed
async function typeOut(reply: Reply) {
  messages.value.push({ role: 'assistant', text: '' })
  const live = messages.value[messages.value.length - 1]

  if (prefersReducedMotion) {
    live.text = reply.text
  } else {
    typing.value = true
    const words = reply.text.split(/(?<=\s)/)
    const step = Math.max(1, Math.ceil(words.length / 40))  // ~40 frames, whatever the length
    for (let i = 0; i < words.length; i += step) {
      live.text += words.slice(i, i + step).join('')
      await sleep(28)
    }
    typing.value = false
  }

  const unseen = reply.followUps.filter(id => !visited.has(id))
  followUps.value = unseen.length ? unseen : reply.followUps
}

export function sendMessage() {
  const question = userInput.value.trim()
  if (!question || busy.value || modelLoading.value) return
  userInput.value = ''
  ask(question)
}

export function askTopic(id: string) {
  ask(TOPICS[id].label, id)
}

export function clearChat() {
  if (busy.value) return
  previousTopicId = null
  visited.clear()
  showWelcome()
}
