import { ref } from 'vue'

// Shared singleton — any component can read/write this
export const aiThinking    = ref(false)
export const gameActive    = ref(false)   // true while the game panel is open
export const gamePlaying   = ref(false)   // true only during active play (not idle/dead)
export const shaderCompiling = ref(false) // true from cache-load-complete until model ready

