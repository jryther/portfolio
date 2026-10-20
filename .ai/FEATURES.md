# Features — AI Agent Reference

## 1. Hero Scene (Hero.vue)

Layer stack inside the hero (all `position: absolute`, `pointer-events: none` — nothing in the scene is clickable):

| Layer | z-index | Content |
|---|---|---|
| `.sky-night` / `.sky-day` | 0 | Dusk and summer-sky gradients, cross-faded by theme (1.8s) |
| `.sky-flash` | 0 | Lightning glow behind the ridgelines (animated with WAAPI) |
| `.mountain` SVG | 1 | Sun, distant bolt, ridgelines, Hood, snowpack, foothills, Bigfoot, foreground firs |
| `cloudCanvas` | 2 | Clouds (storm palette ↔ fair-weather palette) |
| `rainCanvas` | 3 | Rain + splashes |
| `.grain` | 4 | Film-grain overlay |

Hero content and the summit coordinates sit at `z-index: 5`.

### Day / night (theme)
- Driven by `theme` from `composables/useTheme.ts`; a `watch(theme)` calls `cloudController.setDay()`, `rainController.setRaining()` and reschedules lightning
- SVG fills/opacity/transform transition via CSS classes (`.m-far`, `.m-body`, `.m-foot`, `.m-near`, `.night-only`, `.day-only`, `.sun`, `.alpenglow`) with `:root[data-theme="light"] .x` overrides in the scoped styles — **do not** wrap these in `:global()`; Vue drops everything after the `:global()` part and the rule lands on `<html>`
- Light mode: sun rises 300 user units (`.sun` transform), winter snowpack cross-fades to a smaller late-summer cap, ridgelines turn hazy blue / meadow green

### Rain (`initRain`)
- Drop count scales with width (70–170). Each drop has a depth `z` (0 far → 1 near) that sets length (9–23px), speed (1.6–3.8px/frame — a gentle, steady rain), width and opacity (0.12–0.38) for a sense of volume
- Only near drops (`z > 0.55`) splash
- `intensity` eases toward its target (0 or 1) so the rain tapers off over ~2s when switching to light
- The loop stops itself once intensity reaches 0 and splashes finish; `setRaining(true)` restarts it

### Clouds (`initClouds`)
- Two parallax layers (4 far + 3 near; 2 + 2 under 768px), seeded with `mulberry32(42)` so the sky is the same every visit
- **Flat illustrated style** to match the vector ridgelines — no soft gradients. Three kinds (`CLOUD_SHAPES`, picked by `pickKind`): tall **cumulus**, long low **stratus** banks, and small **puffs**, with varied size/aspect
- `makePuffs` builds a scalloped row of round bumps (biggest in the middle) plus crown lumps; `renderCloud` fills their union in the shade tone, then the same shape nudged up-left in the light tone (`source-atop`), leaving shade crescents under each bump. There is deliberately no base slab — everything outside the bumps stays transparent
- Pre-rendered twice (`NIGHT_CLOUDS` slate / `DAY_CLOUDS` white with a cool blue underside) to offscreen canvases
- `dayMix` blends the two caches each frame; when paused (reduced motion / offscreen) `setDay` jumps straight to the target and redraws one frame

### Ambient lightning (dark mode only)
- `scheduleFlash()` fires every 9–20s (first at 4–7s) while `canFlash()`: dark theme, hero visible, scene not paused, tab visible, no reduced motion
- Each strike is a single soft `PULSE` (~120ms rise, ~1.4s fade — no flicker) on `.sky-flash`; 60% chance of a bolt (`makeBolt()`), drawn **behind** the Hood body so the mountain occludes the strike
- **Photosensitivity (WCAG 2.3.1 / 2.3.2):** measured peak change in sky relative luminance is ≈ 0.04 (dusk sky ≈ 0.008 → ≈ 0.05), below the 0.1 that counts as a flash. The bolt and lit Bigfoot are far smaller than the 25%-of-10° area threshold. If you change `.sky-flash` colours or `PULSE`, keep the peak ΔL < 0.1, keep it to one pulse per strike, and avoid saturated red

### Scene pause (WCAG 2.2.2)
- `SceneToggle.vue` — a quiet icon-only pause/play button in the header, beside the theme toggle (hidden under reduced motion, where the scene is already still). Stops rain, clouds and lightning
- Only present while the hero is on screen: the hero's IntersectionObserver sets `heroInView`, and once the hero scrolls away (the scene auto-pauses anyway) the button collapses to zero width, fades out, and becomes `visibility: hidden` so it leaves the tab order — no dead control and no gap in the header
- State lives in `composables/useScene.ts` (`scenePaused`, `toggleScene`, `heroInView`), persisted in `localStorage['scene-paused']`

### Bigfoot
- Original SVG silhouette (`BIGFOOT` path) standing in a clearing in the foreground treeline (`treeline(..., [1160, 1214])` leaves the gap)
- Dark: `.bf-lit` is lit up during roughly 1 in 3 flashes (always the 2nd)
- Light: `.bf` is a slightly darker green than the firs — hiding in plain sight

### Reduced motion
- No rain, no lightning, clouds frozen; theme changes apply instantly

---

## 2. Skills Grid (About.vue)

- `skillGroups` holds three categories (Frontend, Backend & Data, Testing & DevOps), each rendered as a `.card` of `.chip` items
- Icons are desaturated (`saturate(0.2)`, 75% opacity) and pick up their brand colour on chip hover
- Jenkins uses the official simple-icons mark (`techIcons/jenkins.svg`)

---

## 3. AI Chat (popup + "Ask" section)

The chat doesn't generate text. Every reply is pre-written in a decision tree (`src/data/chatTree.ts`), and the only job is picking which topic answers the visitor's question. That keeps it fast and accurate, and it can't make up facts.

### Decision tree (`data/chatTree.ts`)
- Each topic has an `id`, a chip `label`, `keywords`, `examples` (sample questions for the embedding model), an `answer`, and `followUps` (child topic IDs shown as chips after the answer)
- Conversational nodes: `greeting`, `thanks`, `off_topic`, `unknown`. "Tell me more" (`MORE_KEYWORDS`) continues with the first unseen follow-up of the previous topic
- Content comes from a private source document that isn't copied into the repo. The tree ships publicly, so every answer is reviewed before publishing; `chatRouter.spec.ts` checks some of this

### Routing a question
1. **Chips** go straight to their topic
2. **Keywords** (`services/chatRouter.ts` `matchKeywords`) answer instantly when the match is clear: best score ≥ 1 and at least double the runner-up. Hub topics (`hub: true`) score half so specific topics win ties. Works before any model loads
3. **Embedding model** (`services/wllama.ts` `routeWithModel`) handles everything else once loaded: the question is embedded and compared (cosine) against every topic label and example (`services/topicIndex.ts`). A best match below `MIN_SIMILARITY` (0.6) becomes `unknown` if the question mentions Josh/he/his, else `off_topic`
4. Without the model, an unclear question falls back to the best keyword match or `unknown`

### Model
- **Google EmbeddingGemma 300M** (Q8_0 GGUF, ~330 MB, pinned commit on Hugging Face) via **wllama** (llama.cpp compiled to WebAssembly, running in its own worker)
- CPU only (`n_gpu_layers: 0`): no GPU shader compile, and it works without WebGPU, so the chat shows on every device. Multi-threading uses `SharedArrayBuffer`, which needs the COOP/COEP headers
- ~50 ms to embed a question on a desktop CPU
- wllama and the vectors are lazy-loaded (`import('../../services/wllama')`) so the main bundle doesn't pay for them
- Chosen by measurement on a 30-question routing test: IBM Granite 4.0 1B (a chat model choosing a topic ID) got 9/26 and needed a ~1 GB download plus ~16 s of prompt processing; Nomic Embed v1.5 got 16/30; EmbeddingGemma gets 28/30

### Topic vectors (`data/topicVectors.json`)
- Every label and example is embedded ahead of time by `npm run embed:topics` (`scripts/embed-topics.mjs` starts Vite, runs the site's own `computeTopicVectors()` in headless Chrome, and writes the JSON). Stored as int8 base64
- The file carries a hash of the model, prefix, and every doc. `topicIndex.spec.ts` fails when the tree changes without re-running the script, and at runtime a stale file falls back to embedding in the browser (~10 s) with a console warning
- **After editing labels or examples in `chatTree.ts`, run `npm run embed:topics`**

### UI
- Two views of one shared conversation (`composables/useChat.ts`): the floating popup (`AiChat.vue`) and the full-page `#chat` section (`ChatSection.vue`), both rendering `ChatPanel.vue`
- While the section covers the middle of the screen the floating button hides, closing an open popup first; it comes back when the section scrolls away
- The section adds "How it works", three "try asking in your own words" examples (clicking one replaces the chat input with it and focuses the input, without sending), and model facts
- Opening the panel shows a welcome message and topic chips immediately; free text works from the start (keywords)
- A status strip above the input offers "Load AI · ~330 MB". Returning visitors with the model cached load it automatically on open
- While loading: progress bar in the strip
- While loading, the text input and Send are disabled (chips still work), so free-text answers never switch from keyword-only to model routing mid-conversation. Otherwise Send stays enabled; an empty input just does nothing
- The input uses `:value` + `@input` instead of `v-model` so it updates during phone-keyboard composition; Enter is ignored while an IME is composing
- Replies get a short "thinking" beat (500 ms minimum), then type out a few words at a time; both are skipped for `prefers-reduced-motion`
- Follow-up chips show the topic's unseen children (all children once every one has been seen)
- Panel width is capped at `calc(100vw - 2rem)` inline, because the inline width beats Tailwind's `max-xs:` class

---

## 4. AOS Scroll Animations

Initialized in `main.ts`:
```js
AOS.init({ duration: 600, easing: "ease-out-cubic", offset: 60, once: true, disable: () => prefersReducedMotion })
```

All components use `data-aos` attributes:
- `data-aos="fade-up"` — fades in and rises 12px (distance overridden in `main.css`)
- `data-aos-delay="80"` — small stagger in ms; keep delays at or under ~240ms

Animations run once (`once: true`) — do not re-animate on scroll-up.

---

## 5. Responsive Navigation (Header.vue)

**Desktop (> 768px):** Horizontal flex nav (About / Work / Contact + ghost Resume button); the logo links home

**Scroll state:** after 8px of scroll the header gains a blurred translucent background and hairline border (`.scrolled`)

**Active section:** an `IntersectionObserver` (`rootMargin: -40% 0px -55% 0px`) sets `activeId`; the matching link gets `.current` (amber dot on desktop, amber text on mobile) and `aria-current`

**Mobile (≤ 768px):**
- Hamburger button (3 `<span>` lines) appears
- `.nav` collapses to `max-height: 0; overflow: hidden`
- Vue ref `isMenuOpen` toggles `.active` class → `max-height: 400px` CSS transition
- Active state animates spans into × shape via `nth-child` transforms

---

## 6. Contact Form (ContactForm.vue)

- Submits to Formspree via `fetch` POST with JSON body
- `formspreeEndpoint` is currently `'https://formspree.io/f/YOUR_FORM_ID'` — owner must replace
- Success: `submitted` ref shows green success message for 5 seconds then hides
- No client-side validation beyond HTML5 `required` attributes

---

## 7. Document Downloads (About.vue)

Resume and Cover Letter are imported as Vite asset URLs:
```js
import resumeUrl      from '../assets/Resume.pdf'
import coverLetterUrl from '../assets/Cover Letter.docx'
```
Both files get content-hashed filenames in production (`Resume-XXXXX.pdf`).
Buttons use `<a :href="url" download="filename">` — browser-native download.

---

## 8. Professional Work Section (Project.vue)

- TestNav app store links appear above the work cards with Apple and Microsoft SVG icons styled to match the amber theme
- Four work cards — layout only, no interactive links (all `link` and `github` values are `'#'`)
- Cards have no hover lift/transform effect — intentionally informational only
- Achievements use `before:content-['✓']` Tailwind pseudo-element utility

---

## 9. Cloudflare Pages Deployment

```sh
npm run build
```

`npm run build` runs lint → tests → `vite build` in sequence. Cloudflare Pages auto-deploys on every push to `main`.

`public/_headers` sets the COOP/COEP headers that let wllama use `SharedArrayBuffer` for multi-threading:
```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: credentialless
```

`vite.config.ts` `base: '/'` ensures all asset paths resolve correctly from the domain root.

