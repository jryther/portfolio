# Architecture — AI Agent Reference

## Entry Points

| File | Role |
|---|---|
| `index.html` | HTML shell; loads `/src/main.ts` |
| `src/main.ts` | Creates Vue app, imports `main.css`, initializes AOS |
| `src/App.vue` | Root component — composes Header, Hero, About, Project, Contact, Footer, AiChat |
| `src/styles/main.css` | Tailwind v4 entry point (`@import "tailwindcss"`, `@theme`, `@layer base/components`) |

---

## Component Tree

```
App.vue
├── Header.vue              (fixed, z-index 100)
├── main
│   ├── Hero.vue            (id="home",  full viewport height)
│   ├── About.vue           (id="about")
│   ├── Project.vue         (id="projects")
│   ├── ChatSection.vue     (id="chat", full-page chat + how it works)
│   │   └── AiChat/ChatPanel.vue
│   └── Contact.vue         (id="contact")
│       └── ContactForm.vue
├── Footer.vue
└── AiChat/AiChat.vue       (fixed overlay, z-index 9999)
    └── AiChat/ChatPanel.vue
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
- Inline SVG Mount Hood (`.mountain`, z-index 0): layered ridgelines, alpenglow gradient, and seeded-PRNG fir treelines (`firPath` / `treeline`). Sized by height with `aspect-ratio` and `overflow: visible` so the extended ridgelines fill ultrawide screens; centred on the summit below 768px
- Day/night sky divs (z-index 0), the SVG mountain (1), cloud + rain canvases (2, 3) and a film-grain overlay (4); see FEATURES.md §1 for the full stack
- All canvas logic is vanilla JS Canvas 2D API inside `<script setup>`
- Content sits at `z-index: 5`; summit coordinates line pinned to the bottom
- `prefers-reduced-motion`: rain never starts and clouds render as a still frame
- Weather follows the theme: rain + ambient lightning at dusk (dark), sun + fair-weather clouds in summer (light)
- Bigfoot is an SVG silhouette in the treeline — lit by lightning flashes in dark mode, hiding in plain sight in light mode. Nothing in the hero is clickable
- `clamp()` font sizes and responsive breakpoints live in `<style scoped>` (Canvas CSS and clamp cannot be expressed as Tailwind utilities)

### `About.vue`
- Three blocks: bio + "At a glance" card, experience & education timeline (`timeline` array), and skills grouped by category (`skillGroups` array)
- Timeline rail/dot styles and the skill-chip desaturate→colour hover live in `<style scoped>`
- Download buttons use the global `.button-ghost` class
- Resume and cover letter imported as asset URLs via Vite

### `Project.vue`
- Four work cards rendered from a `const projects = [...]` array in `<script setup>`, in a bento grid (cards 1 and 4 span two columns on `lg`)
- Each card has mono tech `tags` (taken from the resume) and a cursor-following `.spotlight` glow fed by `trackPointer`
- Compact "TestNav ships on" row with App Store / Microsoft Store links beside the heading
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

### Chat: `composables/useChat.ts`, `AiChat/ChatPanel.vue`, `AiChat/AiChat.vue`, `ChatSection.vue`
- **`useChat.ts`** holds the one conversation (messages, follow-up chips, input, model status) and its actions (`openChat`, `startModel`, `sendMessage`, `askQuestion`, `askTopic`, `clearChat`). The popup and the section share it, so a chat started in one continues in the other
- `modelStatus`: `idle` → `loading` → `ready` | `error`. `openChat()` greets once and auto-loads the model if it's already cached
- Replies come from `chatTree.ts`, routed by `chatRouter.ts` (keywords) then `wllama.ts` (embeddings), and type out word by word
- **`ChatPanel.vue`** is one view of that conversation: messages, chips, the model status strip, input. `large` prop = roomier type for the section. Each instance scrolls its own message list
- **`AiChat.vue`** = the floating button + popup (fixed bottom-right, `z-index: 9999`) wrapping a ChatPanel. Shows on every device (wllama runs on the CPU)
- **`ChatSection.vue`** (`#chat`, "05 — Ask", nav link "Ask") = a full-page ChatPanel plus how it works, "try asking in your own words" examples (click to fill the chat input, not send) and model facts. Its IntersectionObserver (middle 30% of the viewport) sets `chatSectionInView` and greets on first view
- While `chatSectionInView`, the floating button steps aside: an open popup closes first (280 ms leave transition), then the button fades out (`<Transition name="fab">` + `v-show`); it fades back when the section leaves
- On desktop the section's top padding is trimmed so landing from the nav (scroll-padding 8rem) shows the whole chat card
- Both chat headers have a game icon that swaps the ChatPanel for `MiniGame.vue` (lazy-loaded). See FEATURES.md §3b

---

## Services & Data

### `data/chatTree.ts`
- The chat's decision tree: topics with labels, keywords, example questions, pre-written answers, and follow-ups. See FEATURES.md §3

### `data/topicVectors.json`
- Precomputed embeddings of every topic label and example (`npm run embed:topics`). Don't edit by hand

### `services/chatRouter.ts`
- Pure functions: `matchKeywords` (instant routing + confidence), `resolveReply` ("tell me more" handling), `isConversational`

### `services/topicIndex.ts`
- Pure functions: `buildDocs`, `docsHash`, int8 `encodeVectors`/`decodeVectors`, `rankTopics` (cosine), `pickTopic` (similarity floor)

### `game/flappySim.ts`, `game/flappyRender.ts`
- Mini-game simulation (fixed-step, world units, seeded) and canvas renderer (cached parallax tiles, DPR-aware, themed)

### `composables/useGame.ts`
- `gamePlaying`: true during a round; Hero pauses its scene then

### `services/chatModel.ts`
- Model name, pinned URL, size label, task prefix, dimensions. Separate so the UI can show them without loading wllama

### `services/wllama.ts`
- `loadModel(onProgress)`, `isModelCached()`, `routeWithModel(question)`, `embed(text)`, `computeTopicVectors()`, `loadWeights()`
- wllama runs inference in its own worker; this module is lazy-loaded by AiChat

---

## Vite Configuration (`vite.config.ts`)

```ts
base: '/'                       // Cloudflare Pages serves from domain root
plugins: [tailwindcss(), vue()] // Tailwind MUST be first plugin
assetsInclude: ['**/*.docx']    // .docx treated as static asset
server.host: 'localhost'        // Required for COOP/COEP to work locally
server.headers: {               // SharedArrayBuffer for wllama multi-threading in dev
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless'
}
worker.format: 'es'             // ESM workers
build.chunkSizeWarningLimit: 3000  // The lazy wllama chunk is ~540 kB
```

Production COOP/COEP headers are served via `public/_headers` (Cloudflare Pages).

---

## Asset Pipeline

- `.svg` icons imported in `<script setup>` → Vite returns URL string → used in `<img :src="...">`
- `.pdf`, `.docx` imported → Vite returns URL → used in `<a :href="..." download>`
- `.webp`, `.png` imported → Vite returns URL → used in `<img :src="...">`
- All assets under `src/assets/` get content-hashed filenames in production build

---

## Scroll & Animation

- **AOS** (`aos` npm package): initialized in `main.ts` with `duration: 600, offset: 60, once: true`, disabled under reduced motion. Components use `data-aos="fade-up"` (travel distance shortened to 12px in `main.css`) / `data-aos-delay="N"` attributes
- **Canvas animations**: managed entirely in `Hero.vue` via `requestAnimationFrame` loops started on `onMounted` and cleaned up on `onUnmounted`

