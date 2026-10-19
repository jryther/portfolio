# Josh Ryther — Portfolio v3

Personal portfolio website for Josh Ryther, Full-Stack Software Engineer based in Portland, Oregon.
Live at **[https://portfolio-v3.jryther91.workers.dev](https://portfolio-v3.jryther91.workers.dev)**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API) |
| Build tool | Vite 7 |
| Styling | Tailwind CSS v4 + scoped `<style>` for animations |
| Animations | AOS (Animate On Scroll) + Canvas 2D |
| AI chat | `@mlc-ai/web-llm` — runs entirely in the browser via WebGPU |
| Testing | Vitest + `@vue/test-utils` |
| Deployment | Cloudflare Pages (auto-deploy on push to `main`) |

---

## Features

- **Pacific Northwest theme** — Wet-basalt backgrounds, Douglas-fir greens, and a single sunset-amber accent; Inter + JetBrains Mono
- **SVG Mount Hood hero** — Layered ridgelines with procedurally generated fir treelines and alpenglow
- **Dark / light mode** — Toggle in the header (dark by default, choice remembered). Dark is a rainy dusk with ambient lightning; light is a clear summer day with the sun rising behind Hood
- **Bigfoot easter egg** — Watch the treeline during a lightning flash, or look closely in the sun
- **AI chat modal** — Floating button (bottom-right) that opens a chat powered by a quantized LLM. Only renders if the browser supports WebGPU. The model answers questions about Josh's professional background
- **Experience timeline & skills grid** — Work and education on one timeline; skills grouped by category
- **Responsive** — Full mobile/tablet/desktop support with hamburger nav

---

## Local Development

```sh
npm install
npm run dev
# App available at http://localhost:5173/
```

> **Note:** The dev server requires `localhost` (not `127.0.0.1`) due to [COOP/COEP headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy) required by the WebLLM/SharedArrayBuffer AI model.

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
│   │   ├── useAiState.spec.ts
│   │   ├── useTheme.spec.ts
│   │   └── useScene.spec.ts
│   ├── data/
│   │   └── resumeContext.spec.ts
│   └── services/
│       └── webllm.spec.ts
│
├── styles/
│   └── main.css              # Tailwind v4 entry — @theme, @layer base/components
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
│   ├── Project.vue           # Professional work cards + app store links
│   ├── Contact.vue           # Contact links + form card
│   ├── ContactForm.vue       # Formspree-backed email form
│   ├── Footer.vue            # One-line footer + trademark disclaimer
│   └── AiChat/
│       └── AiChat.vue        # Floating AI chat modal
│
├── composables/
│   ├── useAiState.ts         # Shared AI loading/ready state
│   ├── useTheme.ts           # Dark/light theme state + persistence
│   └── useScene.ts           # Hero animation pause state
│
├── data/
│   └── resumeContext.ts      # Resume/cover letter context string fed to the LLM
│
├── services/
│   └── webllm.ts             # loadModel / askQuestion / clearHistory API
│
├── workers/
│   └── webllm.worker.ts      # Web Worker that runs the LLM off the main thread
│
├── App.vue                   # Root — composes all sections
└── main.ts                   # App entry, AOS init
```

---

## Customization

All personalizable content lives in the Vue components. Key locations:

| What | Where |
|---|---|
| Name, tagline, social links | `Hero.vue` |
| Bio, education, experience, skills | `About.vue` |
| Professional work cards, app store links | `Project.vue` |
| Contact email / phone | `Contact.vue` |
| Form submission endpoint | `ContactForm.vue` → `formspreeEndpoint` |
| Footer links | `Footer.vue` |
| AI context (resume/cover letter text) | `data/resumeContext.ts` |
| Design tokens (colors, type scale) | `src/styles/main.css` → `@theme` |

---

## AI Chat — Important Notes

- Only appears when `navigator.gpu` is available (Chrome/Edge with WebGPU enabled)
- Downloads ~740 MB on first use; cached by the browser after that
- Model: Llama-3.2-1B-Instruct (quantized, WASM/WebGPU)
- Runs in a Web Worker to keep the UI responsive
- Prompted to only answer questions relevant to Josh's professional background

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
│   ├── useAiState.spec.ts    # shared ref initialisation and mutation
│   └── useTheme.spec.ts      # default/restore/toggle/persist behaviour
├── data/
│   └── resumeContext.spec.ts # content sanity checks
└── services/
    └── webllm.spec.ts        # buildSystemPrompt, clearHistory, askQuestion guard
```

> **Note:** `webllm.ts` and `webllm.worker.ts` are excluded from coverage because they depend on WebGPU/Worker APIs not available in jsdom. `@mlc-ai/web-llm` is mocked in the service tests.

---

## Trademark Notice

TestNav is a trademark of Pearson Education, Inc. All product names referenced on this site are used for identification purposes only.
