import { ref } from 'vue'

// Visitor-controlled pause for the hero's background animation (WCAG 2.2.2 Pause, Stop, Hide).
// Shared so the header control and the hero scene stay in sync.

export const SCENE_PAUSED_KEY = 'scene-paused'

function readScenePaused(): boolean {
  try {
    return localStorage.getItem(SCENE_PAUSED_KEY) === 'true'
  } catch {
    return false
  }
}

export const scenePaused = ref<boolean>(readScenePaused())

// Set by the hero's IntersectionObserver. Offscreen the scene already pauses itself,
// so the header control steps aside until the hero is back in view.
export const heroInView = ref<boolean>(true)

export function toggleScene() {
  scenePaused.value = !scenePaused.value
  try {
    localStorage.setItem(SCENE_PAUSED_KEY, String(scenePaused.value))
  } catch {
    // Storage unavailable — the pause still applies for this visit
  }
}
