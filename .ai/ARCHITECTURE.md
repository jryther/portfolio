# Architecture — AI Agent Reference

## Entry Points

| File | Role |
|---|---|
| `index.html` | HTML shell; loads `/src/main.ts` |
| `src/main.ts` | Creates Vue app, imports `main.css`, initializes AOS |
| `src/App.vue` | Root component — composes Header, Hero, About, Project, ChatSection, Contact, Footer, AiChat, Notices |
| `src/styles/main.css` | Global stylesheet — design tokens, reset, base element styles, shared classes (`@layer reset, base, components`) |

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
│   │   ├── AiChat/ChatHeader.vue
│   │   └── AiChat/ChatPanel.vue
│   └── Contact.vue         (id="contact")
│       └── ContactForm.vue
├── Footer.vue
├── AiChat/AiChat.vue       (fixed overlay, z-index 9999)
    ├── AiChat/ChatHeader.vue
    └── AiChat/ChatPanel.vue
└── Notices.vue             (toasts, fixed top-right under the header, z-index 10000)
```

Routing is **anchor-based** (`href="#section-id"`), not Vue Router. `scroll-padding-top: 8rem` in CSS offsets scrolling for the fixed header.

---

## Component Responsibilities

### `Header.vue`
- Fixed navigation bar, `z-index: 100`; transparent at the top, translucent charcoal (`color-mix`) with a blur once scrolled (`.scrolled`)
- Right side: Resume menu button (`ResumeMenu.vue`), scene pause, language and theme toggles
- Mobile: hamburger button + `max-height` CSS transition on `.nav.active`
- Desktop nav link colors/hover live in `<style scoped>` with the rest of the header
- Mobile hamburger/active-state `nth-child` selectors kept in `<style scoped>`

### `Hero.vue`
- Inline SVG Mount Hood (`.mountain`, z-index 0): layered ridgelines, alpenglow gradient, and seeded-PRNG fir treelines (`firPath` / `treeline`). Sized by height with `aspect-ratio` and `overflow: visible` so the extended ridgelines fill ultrawide screens; centred on the summit below 768px
- Day/night sky divs (z-index 0), the SVG mountain (1), cloud + rain canvases (2, 3) and a film-grain overlay (4); see FEATURES.md §1 for the full stack
- All canvas logic is vanilla JS Canvas 2D API inside `<script setup>`
- Content sits at `z-index: 5`; summit coordinates line pinned to the bottom
- `prefers-reduced-motion`: rain never starts and clouds render as a still frame
- Weather follows the theme: rain + ambient lightning at dusk (dark), sun + fair-weather clouds in summer (light)
- Bigfoot is an SVG silhouette in the treeline — lit by lightning flashes in dark mode, hiding in plain sight in light mode. Nothing in the hero is clickable
- `clamp()` font sizes and responsive breakpoints live in `<style scoped>`

### `About.vue`
- Three blocks: bio + "At a glance" card, experience & education timeline (`timeline` array), and skills grouped by category (`skillGroups` array)
- Timeline rail/dot styles and the skill-chip desaturate→colour hover live in `<style scoped>`
- Resume button is a `ResumeMenu` (PDF + Word) styled with the global `.button-ghost` class, with `pdf-action="download"` so the PDF downloads here instead of opening in a tab

### `Project.vue`
- Role line, a featured TestNav case study (`featured` bullets + `stats` tiles + store links), and four "around the platform" cards (`supporting`), all from arrays in `<script setup>`
- No per-project tech tags, by design (see FEATURES.md §8); cursor-following `.spotlight` glow fed by `trackPointer`
- No `coming-soon` badge (removed intentionally)
- No hover lift effect on cards (removed intentionally — cards are informational, not interactive links)

### `Contact.vue`
- Contact list from the `contactLinks` array: email, LinkedIn, and location (no link). No phone number
- Delegates form rendering to `ContactForm.vue`

### `ContactForm.vue`
- Controlled form with `v-model` on `formData` ref
- No server: submitting opens the visitor's email app through a `mailto:` link to `CONTACT_EMAIL` (`src/data/contact.ts`), with the subject and message filled in
- `slideIn` `@keyframes` animation on the "your email app should open" note kept in `<style scoped>`

### `Footer.vue`
- One-line bar: copyright/credit line plus LinkedIn and email icon links (`links` array, with `v-tooltip`)
- Trademark disclaimer below (`footer.trademark`: TestNav is a trademark of Pearson Education, Inc.)
- Layout and link hover styles in `<style scoped>`

### Chat: `composables/useChat.ts`, `AiChat/ChatPanel.vue`, `AiChat/AiChat.vue`, `ChatSection.vue`
- **`useChat.ts`** holds the one conversation (messages, follow-up chips, input, model status) and its actions (`openChat`, `startModel`, `sendMessage`, `askQuestion`, `askTopic`, `clearChat`). The popup and the section share it, so a chat started in one continues in the other
- `modelStatus`: `idle` → `loading` ⇄ `paused` → `ready` | `error` (`pauseModel()` aborts the download; `startModel()` resumes it). `openChat()` greets once and auto-loads the model if it's already cached
- Replies come from `chatTree.ts`, routed by `chatRouter.ts` (keywords) then `wllama.ts` (embeddings), and type out word by word
- **`ChatPanel.vue`** is one view of that conversation: messages, chips, the model status strip, input. `large` prop = roomier type for the section. Each instance scrolls its own message list
- **`ChatHeader.vue`** = the title bar both chat surfaces share: title, game toggle (with the slow-load hint), optional close button (`closable`), and a default slot for extra status (the section's AI status pill). `large` = the section's roomier sizing
- **`AiChat.vue`** = the floating button + popup (fixed bottom-right, `z-index: 9999`) wrapping a ChatPanel. Shows on every device (wllama runs on the CPU)
- **`ChatSection.vue`** (`#chat`, "05 — Ask", nav link "Ask") = a full-page ChatPanel plus how it works, "try asking in your own words" examples (click to fill the chat input, not send) and model facts. Its IntersectionObserver (middle 30% of the viewport) sets `chatSectionInView` and greets on first view
- The floating button also hides while the popup is open (same `fab` transition), so its outline never shows behind the panel. Focus moves into the popup on open and back to the button on close. Picking a topic chip parks focus on the ChatPanel itself (`tabindex="-1"`), since the chips are replaced by the answer and focus would otherwise fall to `<body>`, out of reach of the popup's Escape
- While `chatSectionInView`, the floating button steps aside: an open popup closes first (280 ms leave transition), then the button fades out (`<Transition name="fab">` + `v-show`); it fades back when the section leaves
- On desktop the section's top padding is trimmed so landing from the nav (scroll-padding 8rem) shows the whole chat card
- Both chat headers have a game icon that swaps the ChatPanel for `MiniGame.vue` (lazy-loaded). See FEATURES.md §3b

---

## Error Handling (`services/errors.ts`, `Notices.vue`)

- **Logging:** `createLogger(scope)` → `debug/info/warn/error`, printed as `[scope] …`. debug and info only print in dev; warn and error always. This is the only place that calls `console` (ESLint's `no-console` is on), so use a logger instead
- **`handleError(scope, message, error, { level?, notify? })`** — for errors a feature has caught: logs, marks the error handled (so the global handlers skip it), and optionally shows a toast
- **Toasts:** `notify(level, i18nKey, { params?, action?, duration? })`, rendered by `Notices.vue`. Use them only for problems with no place of their own on the page; a feature with its own UI (contact form, chat status strip, game panel) shows its errors inline. Messages are i18n keys under `notices.*`, so they follow the language. Info hides after 6 s, warn after 8 s, errors stay until dismissed; countdowns pause on hover/focus. Same message twice restarts the clock instead of stacking; max 3, and past that the oldest self-hiding notice goes first
- **Accessibility:** two live regions always in the DOM (`role="alert"` for errors, `role="status"` for the rest); a visually hidden level label ("Error:") so colour and icon aren't the only signal; toasts never take focus; Esc dismisses the focused one and focus moves to the next toast or back where it came from
- **`installErrorHandling(app)`** (called in `main.ts`): Vue `errorHandler`, `window` `error` (same-origin scripts only) and `unhandledrejection` → log + "Something went wrong" toast; `vite:preloadError` → "newer version" toast with Reload (not for background prefetches wrapped in `quietly()`, nor while offline); `offline`/`online` → a sticky offline warning
- **`setReporter(fn)`** — hook for a remote error service; none is set (no backend)

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
- `prefetchWhenIdle`: downloads the game's code in the background once a chat view opens

### `services/chatModel.ts`
- Model name, pinned URL, exact size in bytes, size label, task prefix, dimensions. Separate so the UI can show them without loading wllama

### `services/wllama.ts`
- `loadModel(onProgress, signal?)`, `isModelCached()`, `partialDownload()`, `routeWithModel(question)`, `embed(text)`, `computeTopicVectors()`, `loadWeights()`
- Downloads through `modelDownload.ts` and loads the joined Blob with `wllama.loadModel`; an abort (pause) keeps the saved pieces and the worker

### `services/modelDownload.ts`
- Resumable download: 8 MB ranged requests, each saved to Cache Storage under `<url>?piece=<i>` (a query: the cache ignores #fragments), joined into one Blob at the end. Each piece must match its SHA-256 in `data/modelPieces.json` (and its `Content-Range`) before it's saved, so a corrupted or tampered download is never kept or loaded. `savedFraction`, `clearSaved`. After changing the model URL or `PIECE_BYTES`, run `npm run model:hashes -- <file> <sha256>` (the model-update workflow does this)
- wllama runs inference in its own worker; this module is lazy-loaded by AiChat

---

## Vite Configuration (`vite.config.ts`)

```ts
base: '/'                       // Cloudflare Pages serves from domain root
assetsInclude: ['**/*.docx']    // The Word resume is imported as an asset URL
plugins: [vue()]                // plus basicSsl() in 'lan' mode
define: { __VUE_I18N_*__ }      // vue-i18n: Composition API only, no legacy API, no prod devtools
server.host: 'localhost'        // true in 'lan' mode (npm run dev:lan, HTTPS)
server.headers / preview.headers: siteHeaders()   // the /* block of public/_headers (minus HSTS)
worker.format: 'es'             // ESM workers
build.chunkSizeWarningLimit: 1000  // The lazy wllama chunk is ~920 kB
test: { environment: 'jsdom', globals: true, coverage.thresholds, ... }  // Vitest config lives here too
```

Production headers (COOP/COEP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS, and a year-long immutable cache for `/assets/*`) are served via `public/_headers` (Cloudflare Pages). The dev and preview servers read the same file's `/*` block, so the e2e tests (including a `crossOriginIsolated` check) run with the live headers. A Content-Security-Policy is still to be added.

---

## Asset Pipeline

- `.svg` icons imported in `<script setup>` → Vite returns URL string → used in `<img :src="...">`
- `.pdf` and `.docx` imported in `ResumeMenu.vue` → Vite returns URLs → used as the menu items' `href` (types for both in `env.d.ts`)
- Static files that need a fixed URL (favicons, `_headers`) live in `public/`
- All assets under `src/assets/` get content-hashed filenames in production build

---

## Scroll & Animation

- **AOS** (`aos` npm package): initialized in `main.ts` with `duration: 600, offset: 60, once: true`, disabled under reduced motion. Components use `data-aos="fade-up"` (travel distance shortened to 12px in `main.css`) / `data-aos-delay="N"` attributes
- **Canvas animations**: managed entirely in `Hero.vue` via `requestAnimationFrame` loops started on `onMounted` and cleaned up on `onUnmounted`

