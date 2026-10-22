import { ref, type App } from 'vue'

// Error handling for the whole site, in two parts:
//
// - Logging: createLogger(scope) prints to the console with a [scope] prefix. debug and info
//   only print in development; warn and error always do.
// - Notices: notify() shows a toast (components/Notices.vue) for problems with no place of their
//   own on the page. Errors that belong to a feature (the contact form, the chat's model status)
//   are shown inline by that feature and only logged here.
//
// installErrorHandling() catches whatever slips through (Vue errors, uncaught exceptions,
// unhandled promise rejections) so the visitor gets a calm message instead of a broken page.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type NoticeLevel = 'info' | 'warn' | 'error'

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }
const MIN_LEVEL: LogLevel = import.meta.env.DEV ? 'debug' : 'warn'

export interface Logger {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

/** Receives every warning and error, e.g. to send them to a reporting service. None is set */
export type Reporter = (entry: { level: 'warn' | 'error', scope: string, args: unknown[] }) => void
let reporter: Reporter | null = null

export function setReporter(next: Reporter | null) {
  reporter = next
}

export function createLogger(scope: string): Logger {
  const log = (level: LogLevel) => (...args: unknown[]) => {
    if (LEVEL_RANK[level] < LEVEL_RANK[MIN_LEVEL]) return
    // The one place the site writes to the console; debug and info are gated by MIN_LEVEL above
    // eslint-disable-next-line no-console
    console[level](`[${scope}]`, ...args)
    if (reporter && (level === 'warn' || level === 'error')) {
      try { reporter({ level, scope, args }) } catch { /* a broken reporter mustn't break the page */ }
    }
  }
  return { debug: log('debug'), info: log('info'), warn: log('warn'), error: log('error') }
}

// ── Notices ──────────────────────────────────────────────────────────────────

export interface NoticeAction {
  /** i18n key of the button label */
  labelKey: string
  run: () => void
}

export interface Notice {
  id: number
  level: NoticeLevel
  /** i18n key, so the notice follows language changes */
  messageKey: string
  params?: Record<string, unknown>
  action?: NoticeAction
}

export interface NotifyOptions {
  params?: Record<string, unknown>
  action?: NoticeAction
  /** ms before it hides itself; null keeps it until dismissed */
  duration?: number | null
}

// Errors stay until dismissed, so nobody has to read them against a clock (WCAG 2.2.1)
const DEFAULT_DURATION: Record<NoticeLevel, number | null> = { info: 6000, warn: 8000, error: null }
const MAX_NOTICES = 3

export const notices = ref<Notice[]>([])

let nextId = 1
let paused = false
const timers = new Map<number, { remaining: number, started: number, handle?: ReturnType<typeof setTimeout> }>()

function startTimer(id: number) {
  const timer = timers.get(id)
  if (!timer || paused) return
  timer.started = Date.now()
  timer.handle = setTimeout(() => dismiss(id), timer.remaining)
}

/** Shows a toast. Returns its id, for dismiss() */
export function notify(level: NoticeLevel, messageKey: string, options: NotifyOptions = {}): number {
  const duration = options.duration === undefined ? DEFAULT_DURATION[level] : options.duration

  // The same message already showing: restart its clock rather than stacking a copy
  const existing = notices.value.find(n => n.messageKey === messageKey)
  if (existing) {
    const timer = timers.get(existing.id)
    if (timer) {
      clearTimeout(timer.handle)
      timer.remaining = duration ?? timer.remaining
      startTimer(existing.id)
    }
    return existing.id
  }

  const id = nextId++
  notices.value.push({ id, level, messageKey, params: options.params, action: options.action })
  if (duration !== null) {
    timers.set(id, { remaining: duration, started: Date.now() })
    startTimer(id)
  }
  // Too many: drop the oldest one that would have hidden itself anyway, so the ones meant to stay
  // until dismissed (errors, "you're offline") aren't pushed out by passing notes
  while (notices.value.length > MAX_NOTICES) {
    const drop = notices.value.find(n => timers.has(n.id)) ?? notices.value[0]
    dismiss(drop.id)
  }
  return id
}

export function dismiss(id: number) {
  clearTimeout(timers.get(id)?.handle)
  timers.delete(id)
  notices.value = notices.value.filter(n => n.id !== id)
}

/** Holds every notice's countdown, while the visitor is pointing at or focused on them */
export function pauseNotices() {
  if (paused) return
  paused = true
  for (const timer of timers.values()) {
    clearTimeout(timer.handle)
    timer.remaining = Math.max(1000, timer.remaining - (Date.now() - timer.started))
  }
}

export function resumeNotices() {
  if (!paused) return
  paused = false
  for (const id of timers.keys()) startTimer(id)
}

// ── Handling ─────────────────────────────────────────────────────────────────

// Errors a feature has already dealt with, so the global handlers don't report them twice
const handled = new WeakSet<object>()

export interface HandleErrorOptions {
  /** Console level; defaults to error */
  level?: 'warn' | 'error'
  /** i18n key of a toast to show; omit when the feature shows the problem itself */
  notify?: string
  notifyLevel?: NoticeLevel
}

/** Logs an error the caller has caught, and optionally tells the visitor about it */
export function handleError(scope: string, message: string, error: unknown, options: HandleErrorOptions = {}) {
  if (error && typeof error === 'object') handled.add(error)
  createLogger(scope)[options.level ?? 'error'](message, error)
  if (options.notify) notify(options.notifyLevel ?? options.level ?? 'error', options.notify)
}

export function isHandled(error: unknown): boolean {
  return !!error && typeof error === 'object' && handled.has(error)
}

let quietLoads = 0

/** Runs a background download (a prefetch) whose failure the visitor doesn't need to hear about:
 * nothing they asked for is missing, and the real load reports its own failure if it comes to that */
export async function quietly<T>(load: () => Promise<T>): Promise<T> {
  quietLoads++
  try {
    return await load()
  } finally {
    quietLoads--
  }
}

// Noise browsers report as errors that don't affect the page
const IGNORED = [/ResizeObserver loop/i]

function ignorable(message: string): boolean {
  return IGNORED.some(re => re.test(message))
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? '')
}

let offlineNotice: number | null = null

/** Catch-all handlers for anything a feature didn't handle itself. Call once, before mount */
export function installErrorHandling(app: App) {
  const log = createLogger('app')
  const unexpected = (error: unknown, context: string) => {
    if (isHandled(error) || ignorable(messageOf(error))) return
    log.error(context, error)
    notify('error', 'notices.unexpected')
  }

  app.config.errorHandler = (error, _instance, info) => unexpected(error, `Unhandled error in ${info}`)

  window.addEventListener('error', (e) => {
    // Only our own scripts, which always report where they failed. Another origin's scripts (an
    // embed, a browser extension) come through without a filename, as "Script error."
    if (!e.filename?.startsWith(window.location.origin)) return
    unexpected(e.error ?? e.message, 'Uncaught error')
  })

  window.addEventListener('unhandledrejection', e => unexpected(e.reason, 'Unhandled promise rejection'))

  // A lazy chunk failed to load: online and not a background prefetch, that's usually a new deploy
  // having replaced the old files. Offline, the offline notice already explains it
  window.addEventListener('vite:preloadError', (e) => {
    log.warn('Failed to load part of the site', (e as Event & { payload?: unknown }).payload)
    if (quietLoads > 0 || !navigator.onLine) return
    notify('warn', 'notices.outdated', {
      duration: null,
      action: { labelKey: 'notices.reload', run: () => window.location.reload() },
    })
  })

  // Explains why sending a message or downloading the AI model fails, before the visitor tries
  window.addEventListener('offline', () => {
    offlineNotice = notify('warn', 'notices.offline', { duration: null })
  })
  window.addEventListener('online', () => {
    if (offlineNotice !== null) dismiss(offlineNotice)
    offlineNotice = null
  })
}
