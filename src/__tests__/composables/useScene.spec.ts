import { describe, it, expect, beforeEach, vi } from 'vitest'

async function loadScene() {
  vi.resetModules()
  return import('../../composables/useScene')
}

describe('useScene', () => {
  beforeEach(() => localStorage.clear())

  it('starts playing when nothing is stored', async () => {
    const { scenePaused } = await loadScene()
    expect(scenePaused.value).toBe(false)
  })

  it('restores a saved pause', async () => {
    localStorage.setItem('scene-paused', 'true')
    const { scenePaused } = await loadScene()
    expect(scenePaused.value).toBe(true)
  })

  it('toggleScene flips the state and persists it', async () => {
    const { scenePaused, toggleScene } = await loadScene()
    toggleScene()
    expect(scenePaused.value).toBe(true)
    expect(localStorage.getItem('scene-paused')).toBe('true')
    toggleScene()
    expect(scenePaused.value).toBe(false)
    expect(localStorage.getItem('scene-paused')).toBe('false')
  })

  it('assumes the hero is in view until told otherwise', async () => {
    const { heroInView } = await loadScene()
    expect(heroInView.value).toBe(true)
  })
})
