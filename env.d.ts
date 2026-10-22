/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

// aos 2.x (the published @types/aos describe 3.x). Only what main.ts uses
declare module 'aos' {
  interface AosOptions {
    duration?: number
    easing?: string
    offset?: number
    delay?: number
    once?: boolean
    disable?: 'phone' | 'tablet' | 'mobile' | boolean | (() => boolean)
  }
  const AOS: {
    init(options?: AosOptions): void
    refresh(): void
    refreshHard(): void
  }
  export default AOS
}

declare module '*.docx' {
  const url: string
  export default url
}

declare module '*.pdf' {
  const url: string
  export default url
}

