# Josh Ryther — Portfolio v3

Personal portfolio website for Josh Ryther, Full-Stack Software Engineer based in Salem, Oregon.
Live at **[https://portfolio-v3.jryther91.workers.dev](https://portfolio-v3.jryther91.workers.dev)**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API) |
| Build tool | Vite 7 |
| Styling | Plain CSS — a global stylesheet plus scoped `<style>` per component |
| Animations | AOS (Animate On Scroll) + Canvas 2D |
| AI chat | Decision tree of pre-written answers + [wllama](https://github.com/ngxson/wllama) (llama.cpp in WebAssembly) running Google EmbeddingGemma in the browser |
| Testing | Vitest + `@vue/test-utils` |
| Deployment | Cloudflare Pages (auto-deploy on push to `main`) |

---

## Features

- **Pacific Northwest theme** — Wet-basalt backgrounds, Douglas-fir greens, and a single sunset-amber accent; Inter + JetBrains Mono
- **SVG Mount Hood hero** — Layered ridgelines with procedurally generated fir treelines and alpenglow
- **Dark / light mode** — Toggle in the header (dark by default, choice remembered). Dark is a rainy dusk with ambient lightning; light is a clear summer day with the sun rising behind Hood
- **Bigfoot easter egg** — Watch the treeline during a lightning flash, or look closely in the sun
- **AI chat** — A full-page "Ask" section plus a floating popup (which steps aside while the section is on screen), sharing one conversation about Josh's professional background. Answers are pre-written in a decision tree; questions are matched by keyword, or by a small in-browser embedding model the visitor can load (~330 MB, CPU only, works on any device)
- **Mini-game** — A Flappy-style game in the chat, styled like the site (cut-tree stumps and logs, firs, Mt. Hood ridgelines), dark and light themed, and frame-rate independent
- **Experience timeline & skills grid** — Work and education on one timeline; skills grouped by category
- **Responsive** — Full mobile/tablet/desktop support with hamburger nav

---

## Local Development

```sh
npm install
npm run dev
# App available at http://localhost:5173/
```

> **Note:** The dev server requires `localhost` (not `127.0.0.1`) due to [COOP/COEP headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy) that let the in-browser AI model use `SharedArrayBuffer` for multi-threading.

**Testing on other devices (phone, tablet):** run `npm run dev:lan` and open the **Network** URL it prints (`https://192.168.x.x:5173/`). It uses a self-signed certificate, so accept the browser warning once. HTTPS is required there: over plain HTTP on a network IP, browsers turn off the model cache and multi-threading the AI chat needs. If other devices can't connect, allow Node.js through Windows Firewall for your network.

---

## Build & Deploy

```sh
# Production build (runs lint + tests + vite build, outputs to dist/)
npm run build
```

Cloudflare Pages auto-deploys on every push to `main`. The build command and output directory (`dist`) are configured in the Cloudflare Pages dashboard.

---

## Project Structure

```
src/
├── __tests__/
│   ├── components/
│   │   └── ContactForm.spec.ts
│   ├── composables/
│   │   ├── useTheme.spec.ts
│   │   └── useScene.spec.ts
│   └── services/
│       ├── chatRouter.spec.ts
│       └── topicIndex.spec.ts
│
├── styles/
│   └── main.css              # Global styles — tokens, reset, base, shared classes
│
├── assets/
│   ├── Resume.pdf
│   ├── Cover Letter.docx
│   ├── topo.svg              # Topographic contour section background
│   ├── topo-light.svg        # Contour background for light mode
│   ├── spinner-solid-full.svg
│   └── techIcons/            # SVG icons for the skills grid
│
├── components/
│   ├── Header.vue            # Fixed nav with mobile hamburger
│   ├── Hero.vue              # SVG Mount Hood scene, weather, day/night
│   ├── ThemeToggle.vue       # Sun/moon theme switch
│   ├── SceneToggle.vue       # Pause/play the hero animation
│   ├── About.vue             # Bio, timeline, skills grid, documents
│   ├── Project.vue           # Professional work: TestNav case study + supporting work
│   ├── ChatSection.vue       # Full-page "Ask" chat + how it works
│   ├── Contact.vue           # Contact links + form card
│   ├── ContactForm.vue       # Formspree-backed email form
│   ├── Footer.vue            # One-line footer + trademark disclaimer
│   └── AiChat/
│       ├── AiChat.vue        # Floating chat button + popup
│       ├── ChatPanel.vue     # Messages, chips, model status, input (used by both)
│       └── MiniGame.vue      # Flappy-style mini-game behind the chat's game icon
│
├── game/
│   ├── flappySim.ts          # Fixed-step game simulation (frame-rate independent)
│   └── flappyRender.ts       # Themed canvas renderer with cached parallax layers
│
├── composables/
│   ├── useChat.ts            # The shared chat conversation and model state
│   ├── useGame.ts            # "A round is in play" flag (pauses the hero scene)
│   ├── useTheme.ts           # Dark/light theme state + persistence
│   └── useScene.ts           # Hero animation pause state
│
├── data/
│   ├── chatTree.ts           # Chat decision tree: topics, keywords, examples, answers
│   └── topicVectors.json     # Precomputed topic embeddings (npm run embed:topics)
│
├── services/
│   ├── chatRouter.ts         # Keyword routing + "tell me more"
│   ├── topicIndex.ts         # Embedding similarity, vector storage
│   ├── chatModel.ts          # Model name, URL, size
│   └── wllama.ts             # Loads the model, embeds questions
│
├── App.vue                   # Root — composes all sections
└── main.ts                   # App entry, AOS init

scripts/
└── embed-topics.mjs          # Regenerates src/data/topicVectors.json in headless Chrome
```

---

## Customization

All personalizable content lives in the Vue components. Key locations:

| What | Where |
|---|---|
| Name, tagline, social links | `Hero.vue` |
| Bio, education, experience, skills | `About.vue` |
| Professional work (case study, stat tiles, supporting cards) | `Project.vue` |
| Contact email / phone | `Contact.vue` |
| Form submission endpoint | `ContactForm.vue` → `formspreeEndpoint` |
| Footer links | `Footer.vue` |
| AI chat answers, keywords, example questions | `data/chatTree.ts` (then `npm run embed:topics`) |
| Design tokens (colors, type scale) | `src/styles/main.css` → `@theme` |

---

## AI Chat — Important Notes

- Nothing is generated: every reply is written in `src/data/chatTree.ts`, so it can't make things up
- Topic chips and keyword matching work instantly, with no download
- For free-form questions, visitors can load Google EmbeddingGemma 300M (~330 MB, cached after the first visit). It runs on the CPU through wllama in a worker, so there's no GPU shader compile and no WebGPU requirement
- **After changing topic labels or example questions, run `npm run embed:topics`** (needs Node 22+ and Chrome; set `CHROME_PATH` if Chrome isn't in the default location). A test fails if the stored vectors are out of date
- The answers are written from a private source document kept outside the repo and reviewed before publishing, since `chatTree.ts` ships publicly

---

## Contact Form

Uses [Formspree](https://formspree.io/) for serverless email delivery. Replace `YOUR_FORM_ID` in `ContactForm.vue` with your actual Formspree form ID.

---

## Testing

Tests are written with **[Vitest](https://vitest.dev/)** and **[@vue/test-utils](https://test-utils.vuejs.org/)**, running in a `jsdom` environment. Vitest shares `vite.config.ts` directly so no separate babel/transform config is needed.

```sh
# Watch mode (re-runs on file save)
npm test

# Single run (CI-friendly)
npm run test:run

# Single run with coverage report
npm run test:coverage
```

Coverage reports are written to `coverage/` (HTML at `coverage/index.html`).

### Test structure

```
src/__tests__/
├── components/
│   └── ContactForm.spec.ts   # mount/submit/validation behaviour
├── composables/
│   ├── useScene.spec.ts      # hero pause state
│   └── useTheme.spec.ts      # default/restore/toggle/persist behaviour
└── services/
    ├── chatRouter.spec.ts    # tree integrity, keyword routing, "tell me more"
    └── topicIndex.spec.ts    # vector storage, similarity ranking, stale-vector check
```

> **Note:** `services/wllama.ts` is excluded from coverage because it needs WebAssembly workers and a real model, which jsdom can't run. The routing logic it relies on lives in `chatRouter.ts` and `topicIndex.ts`, which are tested.

---

## Trademark Notice

TestNav is a trademark of Pearson Education, Inc. All product names referenced on this site are used for identification purposes only.
