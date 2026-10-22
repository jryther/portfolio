import { ref } from 'vue'

// One shared, live view of the system "reduce motion" setting, so animations follow a change
// made mid-visit instead of only the value at page load

const query = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null

export const prefersReducedMotion = ref<boolean>(query?.matches ?? false)

query?.addEventListener?.('change', (e) => { prefersReducedMotion.value = e.matches })
