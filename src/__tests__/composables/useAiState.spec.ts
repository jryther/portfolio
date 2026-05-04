import { describe, it, expect } from 'vitest'
import { aiThinking } from '../../composables/useAiState'

describe('useAiState', () => {
  it('exports aiThinking as a Vue ref', () => {
    expect(aiThinking).toBeDefined()
    expect(typeof aiThinking.value).toBe('boolean')
  })

  it('initializes aiThinking to false', () => {
    expect(aiThinking.value).toBe(false)
  })

  it('can be set to true', () => {
    aiThinking.value = true
    expect(aiThinking.value).toBe(true)
    aiThinking.value = false // reset
  })

  it('can be toggled back to false', () => {
    aiThinking.value = true
    aiThinking.value = false
    expect(aiThinking.value).toBe(false)
  })
})

