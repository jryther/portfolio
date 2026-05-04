import { describe, it, expect, vi } from 'vitest'

// Mock the web-llm module — it uses WebGPU which isn't available in jsdom
vi.mock('@mlc-ai/web-llm', () => ({
  CreateWebWorkerMLCEngine: vi.fn(),
  WebWorkerMLCEngineHandler: vi.fn(),
}))

// Re-import after mocking so module-level state is fresh
const getModule = () => import('../../services/webllm')

describe('buildSystemPrompt', () => {
  it('includes the resume context in the returned prompt', async () => {
    const { buildSystemPrompt } = await getModule()
    const context = 'FULL NAME: Josh Ryther'
    const prompt = buildSystemPrompt(context)
    expect(prompt).toContain(context)
  })

  it('returns a non-empty string', async () => {
    const { buildSystemPrompt } = await getModule()
    expect(buildSystemPrompt('some context')).toBeTruthy()
  })

  it('instructs the AI to only answer questions about Josh', async () => {
    const { buildSystemPrompt } = await getModule()
    const prompt = buildSystemPrompt('')
    expect(prompt.toLowerCase()).toContain('josh ryther')
  })

  it('includes a rule about keeping answers concise', async () => {
    const { buildSystemPrompt } = await getModule()
    const prompt = buildSystemPrompt('')
    expect(prompt).toContain('3-5 sentences')
  })

  it('wraps the resume context between clear delimiters', async () => {
    const { buildSystemPrompt } = await getModule()
    const prompt = buildSystemPrompt('CONTEXT_DATA')
    expect(prompt).toContain("JOSH'S RESUME & CONTEXT")
    expect(prompt).toContain('--- END ---')
    expect(prompt).toContain('CONTEXT_DATA')
  })
})

describe('askQuestion', () => {
  it('throws an error if the model has not been loaded', async () => {
    const { askQuestion } = await getModule()
    await expect(askQuestion('Who is Josh?', 'context', vi.fn())).rejects.toThrow('Model not loaded')
  })
})

describe('clearHistory', () => {
  it('is exported as a function', async () => {
    const { clearHistory } = await getModule()
    expect(typeof clearHistory).toBe('function')
  })

  it('does not throw when called', async () => {
    const { clearHistory } = await getModule()
    expect(() => clearHistory()).not.toThrow()
  })
})

