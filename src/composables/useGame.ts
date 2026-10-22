import { ref } from 'vue'
import { quietly } from '../services/errors'

// True only while a round is being played (not on the start or game-over screens).
// The hero pauses its weather and lightning then, so low-end devices give the game the frame budget.
export const gamePlaying = ref<boolean>(false)

let prefetched = false

/** Fetch the game's code in the background (once), when the browser has a quiet moment */
export function prefetchWhenIdle(load: () => Promise<unknown>) {
  if (prefetched) return
  prefetched = true
  // A failed prefetch is retried next time; opening the game shows its own error if it still fails
  const run = () => { quietly(load).catch(() => { prefetched = false }) }
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 2000 })
  else setTimeout(run, 300)
}
