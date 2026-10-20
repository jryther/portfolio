import { ref } from 'vue'

// True only while a round is being played (not on the start or game-over screens).
// The hero pauses its weather and lightning then, so low-end devices give the game the frame budget.
export const gamePlaying = ref<boolean>(false)

let prefetched = false

/** Fetch the game's code in the background (once), when the browser has a quiet moment */
export function prefetchWhenIdle(load: () => Promise<unknown>) {
  if (prefetched) return
  prefetched = true
  const run = () => { load().catch(() => { prefetched = false }) }
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 2000 })
  else setTimeout(run, 300)
}
