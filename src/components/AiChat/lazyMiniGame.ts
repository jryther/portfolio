import { defineAsyncComponent } from 'vue'
import GameLoadError from './GameLoadError.vue'
import { handleError } from '../../services/errors'

// The game's code downloads in the background once a chat view opens (see prefetchWhenIdle),
// so the game icon is instant. Shared by the popup and the chat section.

export const loadMiniGame = () => import('./MiniGame.vue')

// Each open gets one quiet retry, which covers a dropped connection; after that the panel says
// what happened. (Not Vue's onError retry: its attempt count never resets, so only the first open
// would get one.) Vue forgets a failed load, so opening the game again starts over
export const MiniGame = defineAsyncComponent({
  loader: () => loadMiniGame()
    .catch(() => loadMiniGame())
    .catch((error: unknown) => {
      handleError('game', 'The mini-game failed to load', error)
      throw error
    }),
  errorComponent: GameLoadError,
})
