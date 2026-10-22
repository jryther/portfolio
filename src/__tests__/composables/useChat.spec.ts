import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import type * as ChatRouter from '../../services/chatRouter'

// A reply that blows up partway, to check the chat recovers instead of locking up
vi.mock('../../services/chatRouter', async (importOriginal) => {
  const actual = await importOriginal<typeof ChatRouter>()
  return { ...actual, resolveReply: vi.fn(() => { throw new Error('tree broke') }) }
})

describe('useChat when an answer fails', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))
  afterEach(() => vi.restoreAllMocks())

  it('says so in the conversation and unlocks the input', async () => {
    const chat = await import('../../composables/useChat')
    chat.openChat()
    chat.userInput.value = 'what does he do'
    chat.sendMessage()
    await flushPromises()

    const last = chat.messages.value[chat.messages.value.length - 1]
    expect(last.role).toBe('assistant')
    expect(last.text).toContain('something went wrong')
    expect(chat.busy.value).toBe(false)
    expect(chat.followUps.value.length).toBeGreaterThan(0)
    expect(console.error).toHaveBeenCalledWith('[chat]', 'Failed to answer a question', expect.any(Error))
  })
})
