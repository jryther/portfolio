# Architecture — AI Agent Reference

## Entry Points

| File | Role |
|---|---|
| `index.html` | HTML shell; loads `/src/main.js` |
| `src/main.js` | Creates Vue app, imports `main.css`, initializes AOS |
| `src/App.vue` | Root component — composes Header, Hero, About, Project, Contact, Footer, AiChat |
| `src/assets/main.css` | Tailwind v4 entry point (`@import "tailwindcss"`, `@theme`, `@layer base/components`) |

---

## Component Tree

```
App.vue
├── Header.vue              (fixed, z-index 100)
├── main
│   ├── Hero.vue            (id="home",  full viewport height)
│   ├── About.vue           (id="about")
│   ├── Project.vue         (id="projects")
│   └── Contact.vue         (id="contact")
│       └── ContactForm.vue
├── Footer.vue
└── AiChat/AiChat.vue       (fixed overlay, z-index 9999)
```

Routing is **anchor-based** (`href="#section-id"`), not Vue Router. `scroll-padding-top: 10rem` in CSS offsets scrolling for the fixed header.

---

## Component Responsibilities

### `Header.vue`
- Fixed navigation bar, `z-index: 100`, `background: rgba(15,20,25,0.92)`
- Mobile: hamburger button + `max-height` CSS transition on `.nav.active`
- Desktop nav link colors/hover use Tailwind classes
- Mobile hamburger/active-state `nth-child` selectors kept in `<style scoped>`

### `Hero.vue`
- Three stacked `<canvas>` elements (z-index 0, 1, 2) for rain, clouds, lightning
- All canvas logic is vanilla JS Canvas 2D API inside `<script setup>`
- Content sits at `z-index: 3`
- Mount Hood image (`MountHoodImage.webp`) fills the right half
- Bigfoot easter egg: pre-loaded PNG processed into a silhouette offscreen canvas; revealed on click if within `BIGFOOT_PROXIMITY = 280px` of `BIGFOOT_POS = { xFrac: 0.78, yFrac: 0.82 }`
- Lightning always triggers on every click regardless of proximity
- Responsive layout: two-column → stacked below 960px
- `clamp()` font sizes and responsive breakpoints live in `<style scoped>` (Canvas CSS and clamp cannot be expressed as Tailwind utilities)

### `About.vue`
- Skills carousel: duplicated `[...skills, ...skills]` array with CSS `translateX(-50%)` loop animation
- Mask-image fade on carousel edges — cannot be Tailwind, kept in `<style scoped>`
- Download buttons use the global `.button` class
- Resume and cover letter imported as asset URLs via Vite

### `Project.vue`
- Four work cards rendered from a `const projects = [...]` array in `<script setup>`
- App store links for TestNav (Apple + Microsoft) above the cards
- No `technologies` tags (removed intentionally)
- No `coming-soon` badge (removed intentionally)
- No hover lift effect on cards (removed intentionally — cards are informational, not interactive links)

### `Contact.vue`
- Two contact method cards (email + phone) with hover border highlight
- Delegates form rendering to `ContactForm.vue`

### `ContactForm.vue`
- Controlled form with `v-model` on `formData` ref
- Submits to Formspree via `fetch` POST
- `slideIn` `@keyframes` animation on success message kept in `<style scoped>`

### `Footer.vue`
- Three-column grid: Quick Links, Professional, Resources
- Trademark disclaimer at bottom (`TestNav is a trademark of Pearson Education, Inc.`)
- No `<style>` block — 100% Tailwind

### `AiChat/AiChat.vue`
- Renders only if `navigator.gpu` is truthy (WebGPU guard checked on `onMounted`)
- Fixed bottom-right wrapper, `z-index: 9999`
- Toggle button always at natural DOM position in flex column; panel is `position: absolute`
- Three views: pre-load CTA → loading progress → chat messages
- Streaming responses: empty assistant message pushed first, tokens appended via callback
- `firstQuestion` / `firstResponseStarted` flags drive the first-response performance warning
- Chat panel slide-up transition uses Vue `<Transition name="chat-panel">` with scoped CSS
- `meta-badge`, `spin-gear`, `dot` (typing indicator) kept in `<style scoped>` for animation keyframes and `nth-child` delays

---

## Services & Workers

### `services/webllm.js`
- Exports: `loadModel(progressCallback)`, `askQuestion(question, context, tokenCallback)`, `clearHistory()`
- Creates a `webllm.worker.js` Web Worker via Vite's `?worker` import
- Communicates via `postMessage` / `onmessage`
- Layer 1 relevance check: model is prompted to determine if a question is relevant to hiring Josh before answering
- System prompt embedded here — **do not expose to users**

### `workers/webllm.worker.js`
- Runs `@mlc-ai/web-llm` entirely off main thread
- Uses `SharedArrayBuffer` (requires COOP/COEP headers)
- Model: Qwen2.5-1.5B-Instruct-q4f16_1-MLC (cached in browser after first download)

### `data/resumeContext.js`
- Exports a single template literal string containing Josh's resume and cover letter context
- This string is passed as context to every AI query

### `composables/useAiState.js`
- Shared reactive state for AI loading/ready status (used if multiple components need to know AI state)

---

## Vite Configuration (`vite.config.js`)

```js
base: '/portfolio-v3/'          // GitHub Pages sub-path
plugins: [tailwindcss(), vue()] // Tailwind MUST be first plugin
assetsInclude: ['**/*.docx']    // .docx treated as static asset
server.host: 'localhost'        // Required for COOP/COEP to work
server.headers: {               // Required for SharedArrayBuffer (WebLLM)
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp'
}
worker.format: 'es'             // ESM workers for WebLLM compatibility
optimizeDeps.exclude: ['@mlc-ai/web-llm']  // Skip pre-bundling (huge)
build.manualChunks: { 'web-llm': ['@mlc-ai/web-llm'] }  // Separate chunk
build.chunkSizeWarningLimit: 3000  // Suppress warning for WebLLM chunk (~6MB)
```

---

## Asset Pipeline

- `.svg` icons imported in `<script setup>` → Vite returns URL string → used in `<img :src="...">`
- `.pdf`, `.docx` imported → Vite returns URL → used in `<a :href="..." download>`
- `.webp`, `.png` imported → Vite returns URL → used in `<img :src="...">`
- All assets under `src/assets/` get content-hashed filenames in production build

---

## Scroll & Animation

- **AOS** (`aos` npm package): initialized in `main.js` with `duration: 1000, offset: 100, once: true`. Components use `data-aos="fade-in-up"` / `data-aos-delay="N"` attributes
- **Canvas animations**: managed entirely in `Hero.vue` via `requestAnimationFrame` loops started on `onMounted` and cleaned up on `onUnmounted`
- **Skills carousel**: CSS-only `@keyframes skills-scroll` looping `translateX(0)` → `translateX(-50%)` on a doubled item array

