import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createLogger, setReporter, notify, dismiss, notices, pauseNotices, resumeNotices, handleError, isHandled,
  installErrorHandling, quietly,
} from '../../services/errors'
import type { App } from 'vue'

describe('createLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    setReporter(null)
  })

  it('prefixes every message with its scope', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    createLogger('chat').warn('model failed', 42)
    expect(spy).toHaveBeenCalledWith('[chat]', 'model failed', 42)
  })

  it('prints debug and info in development', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    createLogger('x').debug('hello')
    expect(spy).toHaveBeenCalled()
  })

  it('only prints warnings and errors in production', async () => {
    vi.stubEnv('DEV', false)
    vi.resetModules()
    const { createLogger: prodLogger } = await import('../../services/errors')
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const log = prodLogger('x')
    log.debug('a')
    log.info('b')
    log.error('c')
    expect(debug).not.toHaveBeenCalled()
    expect(info).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith('[x]', 'c')
    vi.unstubAllEnvs()
  })

  it('passes warnings and errors to the reporter, but not debug or info', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reporter = vi.fn()
    setReporter(reporter)
    const log = createLogger('x')
    log.info('quiet')
    log.error('loud', 1)
    expect(reporter).toHaveBeenCalledTimes(1)
    expect(reporter).toHaveBeenCalledWith({ level: 'error', scope: 'x', args: ['loud', 1] })
  })

  it('survives a reporter that throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    setReporter(() => { throw new Error('reporter down') })
    expect(() => createLogger('x').error('boom')).not.toThrow()
  })
})

describe('notify', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    notices.value.forEach(n => dismiss(n.id))
    resumeNotices()
    vi.useRealTimers()
  })

  it('adds a notice and returns its id', () => {
    const id = notify('info', 'notices.reload')
    expect(notices.value).toEqual([expect.objectContaining({ id, level: 'info', messageKey: 'notices.reload' })])
  })

  it('does not stack the same message twice', () => {
    const first = notify('warn', 'notices.offline')
    const second = notify('warn', 'notices.offline')
    expect(second).toBe(first)
    expect(notices.value).toHaveLength(1)
  })

  it('drops a passing note before a notice meant to stay', () => {
    notify('warn', 'offline', { duration: null })
    notify('info', 'a')
    notify('info', 'b')
    notify('info', 'c')
    expect(notices.value.map(n => n.messageKey)).toEqual(['offline', 'b', 'c'])
  })

  it('keeps at most three notices, dropping the oldest', () => {
    notify('error', 'a')
    notify('error', 'b')
    notify('error', 'c')
    notify('error', 'd')
    expect(notices.value.map(n => n.messageKey)).toEqual(['b', 'c', 'd'])
  })

  it('hides notes and warnings on their own, but keeps errors until dismissed', () => {
    notify('info', 'note')
    notify('warn', 'warning')
    notify('error', 'failure')
    vi.advanceTimersByTime(60_000)
    expect(notices.value.map(n => n.messageKey)).toEqual(['failure'])
  })

  it('holds the countdown while paused', () => {
    notify('info', 'note', { duration: 1000 })
    vi.advanceTimersByTime(500)
    pauseNotices()
    vi.advanceTimersByTime(10_000)
    expect(notices.value).toHaveLength(1)
    resumeNotices()
    vi.advanceTimersByTime(1000)
    expect(notices.value).toHaveLength(0)
  })

  it('restarts the countdown when the same message comes again', () => {
    notify('info', 'note', { duration: 1000 })
    vi.advanceTimersByTime(800)
    notify('info', 'note', { duration: 1000 })
    vi.advanceTimersByTime(800)
    expect(notices.value).toHaveLength(1)
  })
})

describe('handleError', () => {
  afterEach(() => {
    notices.value.forEach(n => dismiss(n.id))
    vi.restoreAllMocks()
  })

  it('logs at the requested level and marks the error handled', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = new Error('nope')
    handleError('game', 'Sound failed', error, { level: 'warn' })
    expect(spy).toHaveBeenCalledWith('[game]', 'Sound failed', error)
    expect(isHandled(error)).toBe(true)
    expect(notices.value).toHaveLength(0)
  })

  it('shows a notice when asked to', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    handleError('app', 'Broken', new Error('x'), { notify: 'notices.unexpected' })
    expect(notices.value).toEqual([expect.objectContaining({ level: 'error', messageKey: 'notices.unexpected' })])
  })

  it('treats errors it has not seen as unhandled', () => {
    expect(isHandled(new Error('fresh'))).toBe(false)
    expect(isHandled('a string')).toBe(false)
  })
})

describe('installErrorHandling', () => {
  const app = { config: {} } as App
  installErrorHandling(app)

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    notices.value.forEach(n => dismiss(n.id))
    vi.restoreAllMocks()
  })

  const messageKeys = () => notices.value.map(n => n.messageKey)
  const scriptError = (filename: string) =>
    window.dispatchEvent(new ErrorEvent('error', { message: 'boom', filename, error: new Error('boom') }))
  const preloadError = () => window.dispatchEvent(new Event('vite:preloadError'))

  it('reports an error from one of our own scripts', () => {
    scriptError(`${window.location.origin}/src/main.ts`)
    expect(messageKeys()).toEqual(['notices.unexpected'])
  })

  it("ignores another origin's script, which reports no filename", () => {
    scriptError('')
    scriptError('https://other.example/embed.js')
    expect(notices.value).toHaveLength(0)
  })

  it('skips errors a feature already handled', () => {
    const error = new Error('dealt with')
    handleError('game', 'Already shown', error)
    app.config.errorHandler!(error, null, 'setup function')
    expect(notices.value).toHaveLength(0)
  })

  it('offers a reload when part of the site fails to load', () => {
    preloadError()
    expect(messageKeys()).toEqual(['notices.outdated'])
  })

  it('says nothing when a background prefetch fails', async () => {
    await quietly(async () => { preloadError(); throw new Error('prefetch failed') }).catch(() => {})
    expect(notices.value).toHaveLength(0)
  })

  it('leaves a failed load to the offline notice while offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    preloadError()
    expect(messageKeys()).not.toContain('notices.outdated')
  })
})
