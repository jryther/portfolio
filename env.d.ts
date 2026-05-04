/// <reference types="vite/client" />
/// <reference types="@types/aos" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module '*.docx' {
  const url: string
  export default url
}

declare module '*.pdf' {
  const url: string
  export default url
}

