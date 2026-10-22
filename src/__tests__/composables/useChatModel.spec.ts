import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'

// Loading the AI model, with the model service replaced: each load reports progress and waits
// until the test finishes it, or rejects with an AbortError when its signal aborts (a pause).

const service = vi.hoisted(() => ({
  cached: false,
  partial: 0,
  loads: [] as { progress: (p: number) => void, finish: () => void, signal?: AbortSignal }[],
}))

vi.mock('../../services/wllama', () => ({
  isModelCached: async () => service.cached,
  partialDownload: async () => service.partial,
  loadModel: (progress: (p: number) => void, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
    signal?.addEventListener('abort', () => reject(new DOMException('Paused', 'AbortError')))
    service.loads.push({ progress, finish: resolve, signal })
  }),
}))

async function freshChat() {
  vi.resetModules()
  return import('../../composables/useChat')
}

describe('useChat model loading', () => {
  beforeEach(() => {
    service.cached = false
    service.partial = 0
    service.loads = []
  })

  it('pauses a download and resumes it from the same percentage', async () => {
    const chat = await freshChat()
    chat.startModel()
    await flushPromises()
    service.loads[0].progress(0.42)
    expect(chat.modelStatus.value).toBe('loading')
    expect(chat.downloading.value).toBe(true)

    chat.pauseModel()
    await flushPromises()
    expect(chat.modelStatus.value).toBe('paused')
    expect(chat.loadingProgress.value).toBe(42)
    // Free text still works while paused (keyword answers)
    expect(chat.modelLoading.value).toBe(false)

    chat.startModel()
    expect(chat.modelStatus.value).toBe('loading')
    expect(chat.loadingProgress.value).toBe(42)   // not back to 0 while it picks up
    await flushPromises()
    expect(service.loads).toHaveLength(2)
    service.loads[1].finish()
    await flushPromises()
    expect(chat.modelStatus.value).toBe('ready')
  })

  it('cannot pause once the download is done and the model is starting', async () => {
    const chat = await freshChat()
    chat.startModel()
    await flushPromises()
    service.loads[0].progress(1)
    expect(chat.downloading.value).toBe(false)
    chat.pauseModel()
    expect(service.loads[0].signal!.aborted).toBe(false)
  })

  it('shows a download left unfinished on an earlier visit as paused, ready to resume', async () => {
    service.partial = 0.25
    const chat = await freshChat()
    chat.openChat()
    await flushPromises()
    expect(chat.modelStatus.value).toBe('paused')
    expect(chat.loadingProgress.value).toBe(25)
    expect(service.loads).toHaveLength(0)   // nothing downloads until they choose to resume
  })

  it('loads a fully cached model on its own when the chat opens', async () => {
    service.cached = true
    const chat = await freshChat()
    chat.openChat()
    await flushPromises()
    expect(chat.modelStatus.value).toBe('loading')
    expect(chat.downloading.value).toBe(false)   // from the cache: nothing to pause
  })
})
