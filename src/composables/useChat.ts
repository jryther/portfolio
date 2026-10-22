import { ref, computed, watch } from 'vue'
import { WELCOME, UNKNOWN_ID, topicLabel, topicAnswer, welcomeText } from '../data/chatTree'
import { matchKeywords, resolveReply, isConversational, type Reply } from '../services/chatRouter'
import { i18n, locale } from '../i18n'
import { handleError } from '../services/errors'
import { prefersReducedMotion } from './useReducedMotion'

// One conversation shared by the floating popup and the full-page chat section, so a chat
// started in one carries on in the other. Replies come in the current UI language, and
// switching language re-renders every pre-written message (not what the visitor typed).

// wllama (~0.5 MB of JS plus its wasm) only loads once the chat needs the model
const modelService = () => import('../services/wllama')

// paused: the visitor stopped the download partway; what's downloaded is kept for a resume
export type ModelStatus = 'idle' | 'loading' | 'paused' | 'ready' | 'error'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  /** Set when the text is pre-written (a topic answer, a chip's label, the welcome), so it can
   * be re-rendered in another language */
  topicId?: string
}

const WELCOME_MESSAGE_ID = 'welcome'
// An answer that failed partway; rendered from the UI messages, so it follows the language too
const REPLY_ERROR_ID = 'reply-error'

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
// A load from the browser cache isn't a download (and may report no progress at all)
export const downloading  = computed(() => modelLoading.value && loadingProgress.value < 100 && !loadingFromCache.value)
export const loadingText  = computed(() => downloading.value
  ? i18n.global.t('chat.downloading')
  : i18n.global.t('chat.starting'))

// Only suggest the game when loading is actually slow. A first-time download gets the hint
// soon; a load from the browser cache usually finishes in a couple of seconds, so it only
// gets one if it drags on (a hint that flashes up and vanishes would just be noise)
const SLOW_DOWNLOAD_MS = 1500
const SLOW_CACHED_MS = 4000
const loadingFromCache = ref<boolean>(false)

/** True once the model has been loading for a noticeable while */
export const slowLoad = ref<boolean>(false)
let slowTimer: ReturnType<typeof setTimeout> | undefined
watch(modelStatus, (status) => {
  clearTimeout(slowTimer)
  if (status === 'loading') {
    slowTimer = setTimeout(() => { slowLoad.value = true }, loadingFromCache.value ? SLOW_CACHED_MS : SLOW_DOWNLOAD_MS)
  }
  else slowLoad.value = false
})

/** Label for the chat header's game button, shared by the popup and the section */
export function gameToggleLabel(showGame: boolean): string {
  const { t } = i18n.global
  if (showGame) return t('chat.backToChat')
  return slowLoad.value ? t('chat.playWhileLoading') : t('chat.playGame')
}


// Where the conversation is in the tree, so "tell me more" knows what to continue
let previousTopicId: string | null = null
const visited = new Set<string>()
let cacheChecked = false

/** A pre-written message's text in the current language */
function localizedText(msg: ChatMessage & { topicId: string }): string {
  if (msg.topicId === WELCOME_MESSAGE_ID) return welcomeText(locale.value)
  if (msg.topicId === REPLY_ERROR_ID) return i18n.global.t('chat.replyError')
  return msg.role === 'user' ? topicLabel(msg.topicId, locale.value) : topicAnswer(msg.topicId, locale.value)
}

function showWelcome() {
  messages.value = [{ role: 'assistant', text: welcomeText(locale.value), topicId: WELCOME_MESSAGE_ID }]
  followUps.value = [...WELCOME.followUps]
}

// The message still typing out is skipped; typeOut settles it in the new language when done
watch(locale, () => {
  messages.value.forEach((msg, i) => {
    const typingThis = typing.value && i === messages.value.length - 1
    if (msg.topicId && !typingThis) msg.text = localizedText(msg as ChatMessage & { topicId: string })
  })
})

/** Call when a chat view opens: greets once, and loads the model if it's already cached */
export function openChat() {
  if (!messages.value.length) showWelcome()
  autoLoadIfCached()
}

// A returning visitor already has the model cached, so there's no download to ask about. One who
// left partway through the download sees it paused where it stopped, ready to resume
async function autoLoadIfCached() {
  if (cacheChecked || modelStatus.value !== 'idle') return
  cacheChecked = true
  try {
    const { savedModel } = await modelService()
    const { cached, partial } = await savedModel()
    if (!cached) {
      if (partial > 0 && modelStatus.value === 'idle') {
        loadingProgress.value = Math.floor(partial * 100)
        modelStatus.value = 'paused'
      }
      return
    }
  } catch (e) {
    // Nothing to show: the visitor still gets the "Load AI" offer, which reports its own failure
    handleError('chat', 'Could not check for a cached AI model', e, { level: 'warn' })
    return
  }
  loadingFromCache.value = true
  startModel()
}

let download: AbortController | null = null

/** Starts loading the model, or resumes a paused download from where it stopped */
export async function startModel() {
  if (modelStatus.value === 'loading' || modelStatus.value === 'ready') return
  // A resume carries on from the paused percentage until the first piece reports in
  if (modelStatus.value !== 'paused') loadingProgress.value = 0
  modelStatus.value = 'loading'
  download = new AbortController()
  try {
    const { loadModel } = await modelService()
    await loadModel((progress) => {
      // Rounded down, so it never shows 100% while the last bytes are still coming
      loadingProgress.value = Math.floor(progress * 100)
    }, download.signal)
    loadingProgress.value = 100
    modelStatus.value = 'ready'
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      modelStatus.value = 'paused'
      return
    }
    // The chat's status strip shows this one, with a retry
    modelStatus.value = 'error'
    // A retry may download the model again (a failed cached copy is cleared), so it gets the
    // download timing for the slow-load hint
    loadingFromCache.value = false
    handleError('chat', 'The AI model failed to load', e)
  }
}

/** Pauses the download. Only while downloading: a load from the cache takes a moment anyway */
export function pauseModel() {
  if (downloading.value) download?.abort()
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
      handleError('chat', 'Model routing failed, falling back to keywords', e, { level: 'warn' })
    }
  }
  return best?.id ?? UNKNOWN_ID
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

async function ask(question: string, topicId?: string) {
  if (busy.value) return
  // A chip's question is its label, so it can be re-rendered like an answer
  messages.value.push({ role: 'user', text: question, topicId })
  followUps.value = []
  thinking.value = true
  const answerAt = messages.value.length

  try {
    const started = performance.now()
    const routed = topicId ?? await route(question)
    const reply = resolveReply(routed, previousTopicId, visited, locale.value)

    // Instant answers still get a beat of "thinking" so the exchange reads as a conversation
    const minThinking = prefersReducedMotion.value ? 0 : 500
    const elapsed = performance.now() - started
    if (elapsed < minThinking) await sleep(minThinking - elapsed)

    thinking.value = false
    await typeOut(reply)

    // Only a shown answer counts as seen, so one that failed doesn't steer "tell me more"
    if (!isConversational(reply.topicId)) {
      previousTopicId = reply.topicId
      visited.add(reply.topicId)
    }
    const unseen = reply.followUps.filter(id => !visited.has(id))
    followUps.value = unseen.length ? unseen : reply.followUps
  } catch (e) {
    handleError('chat', 'Failed to answer a question', e)
    showReplyError(answerAt)
  }
}

// Say so in the conversation (in place of any half-typed answer), unlock the input, and offer
// the starting topics again so the visitor has somewhere to go
function showReplyError(answerAt: number) {
  thinking.value = false
  typing.value = false
  messages.value.splice(answerAt)
  messages.value.push({ role: 'assistant', text: i18n.global.t('chat.replyError'), topicId: REPLY_ERROR_ID })
  followUps.value = [...WELCOME.followUps]
}

// Reveal the answer a few words at a time, like it's being typed
async function typeOut(reply: Reply) {
  messages.value.push({ role: 'assistant', text: '', topicId: reply.topicId })
  const live = messages.value[messages.value.length - 1] as ChatMessage & { topicId: string }

  if (prefersReducedMotion.value) {
    live.text = localizedText(live)
  } else {
    typing.value = true
    // Read the text now, not when the question was routed, in case the language changed meanwhile
    const words = localizedText(live).split(/(?<=\s)/)
    const step = Math.max(1, Math.ceil(words.length / 40))  // ~40 frames, whatever the length
    for (let i = 0; i < words.length; i += step) {
      live.text += words.slice(i, i + step).join('')
      await sleep(28)
    }
    typing.value = false
  }
  // In case the language changed while it was typing (the watcher skips the message being typed)
  live.text = localizedText(live)
}

export function sendMessage() {
  const question = userInput.value.trim()
  if (!question || busy.value || modelLoading.value) return
  userInput.value = ''
  ask(question)
}

export function askTopic(id: string) {
  ask(topicLabel(id, locale.value), id)
}

export function clearChat() {
  if (busy.value) return
  previousTopicId = null
  visited.clear()
  showWelcome()
}
