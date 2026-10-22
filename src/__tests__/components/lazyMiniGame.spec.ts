import { describe, it, expect, vi, afterEach } from 'vitest'
import { loadWithRetry } from '../../components/AiChat/lazyMiniGame'
import { notices, dismiss } from '../../services/errors'

describe('loadWithRetry (the mini-game download)', () => {
  afterEach(() => {
    notices.value.forEach(n => dismiss(n.id))
    vi.restoreAllMocks()
  })

  it('loads once when the first try works', async () => {
    const load = vi.fn().mockResolvedValue('game')
    await expect(loadWithRetry(load)).resolves.toBe('game')
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('quietly tries once more after a failure', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue('game')
    await expect(loadWithRetry(load)).resolves.toBe('game')
    expect(load).toHaveBeenCalledTimes(2)
    expect(error).not.toHaveBeenCalled()
  })

  it('reports the error and gives up after the retry fails too', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const load = vi.fn().mockRejectedValue(new Error('offline'))
    await expect(loadWithRetry(load)).rejects.toThrow('offline')
    expect(load).toHaveBeenCalledTimes(2)
    expect(error).toHaveBeenCalled()
  })

  it('gives every new open its own retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const load = vi.fn().mockRejectedValue(new Error('offline'))
    await loadWithRetry(load).catch(() => {})
    load.mockReset().mockRejectedValueOnce(new Error('offline')).mockResolvedValue('game')
    await expect(loadWithRetry(load)).resolves.toBe('game')
  })
})
