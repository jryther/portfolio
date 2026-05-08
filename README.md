# Josh Ryther — Portfolio v3

Personal portfolio website for Josh Ryther, Full-Stack Software Engineer based in Portland, Oregon.
Live at **[https://jryth.github.io/portfolio-v3](https://jryth.github.io/portfolio-v3)**

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
| Linting | ESLint 10 + `typescript-eslint` + `eslint-plugin-vue` |
| Deployment | Cloudflare Pages |

---

## Features

- **Pacific Northwest theme** — Deep forest greens, warm amber/wood tones, charcoal backgrounds
- **Rain + cloud + lightning canvas animations** — Confined to the hero section
- **Bigfoot easter egg** — Click near his position on the hero to reveal him during a lightning flash
- **AI chat modal** — Floating button (bottom-right) that opens a chat powered by a quantized LLM. Only renders if the browser supports WebGPU. The model answers questions about Josh's professional background
- **Skills carousel** — Infinite horizontal scroll of tech icons
- **Responsive** — Full mobile/tablet/desktop support with hamburger nav

---

## Local Development

```sh
npm install
npm run dev
# App available at http://localhost:5173/portfolio-v3/
```

> **Note:** The dev server requires `localhost` (not `127.0.0.1`) due to [COOP/COEP headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy) required by the WebLLM/SharedArrayBuffer AI model.

---

## Build & Deploy

```sh
# Production build (outputs to dist/)
# Runs lint + tests first — build fails if either step fails
npm run build
```

The `base` path in `vite.config.ts` is set to `/` for Cloudflare Pages root hosting.

### Cloudflare Pages setup

Deployments are handled automatically by Cloudflare Pages via GitHub integration.

**First-time setup (one-time, done in the Cloudflare dashboard):**

1. Log in at [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select the `portfolio-v3` repository
3. Set the build configuration:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js version | `22` (auto-detected from `.node-version`) |

4. Click **Save and Deploy**

After the first deploy, every push to `main` triggers an automatic redeploy.

**Why Cloudflare Pages over GitHub Pages:**

GitHub Pages does not support custom HTTP response headers. The AI chat feature requires `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers for `SharedArrayBuffer` (used by WebLLM). Cloudflare Pages honours the `public/_headers` file which sets these headers on every response.

---

## Project Structure

```
src/
├── __tests__/
│   ├── components/
│   │   └── ContactForm.spec.ts
│   ├── composables/
│   │   └── useAiState.spec.ts
│   ├── data/
│   │   └── resumeContext.spec.ts
│   └── services/
│       └── webllm.spec.ts
│
├── styles/
│   ├── main.css              # Tailwind v4 entry — @theme, @layer base/components
│   └── base.css              # Unused (kept for reference)
│
├── assets/
│   ├── Resume.pdf
│   ├── Cover Letter.docx
│   ├── MountHoodImage.webp   # Hero right-side image
│   ├── bigfoot.png           # Bigfoot easter egg source
│   ├── spinner-solid-full.svg
│   └── techIcons/            # SVG icons for skills carousel
│
├── components/
│   ├── Header.vue            # Fixed nav with mobile hamburger
│   ├── Hero.vue              # Canvas rain/clouds/lightning + layout
│   ├── About.vue             # Bio, education, experience, skills carousel, documents
│   ├── Project.vue           # Professional work cards + app store links
│   ├── Contact.vue           # Contact info cards
│   ├── ContactForm.vue       # Formspree-backed email form
│   ├── Footer.vue            # Links + trademark disclaimer
│   └── AiChat/
│       └── AiChat.vue        # Floating AI chat modal
│
├── composables/
│   └── useAiState.ts         # Shared AI loading/ready state
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

eslint.config.ts              # ESLint flat config — TS + Vue rules
vite.config.ts                # Vite + Vitest config
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
- Model: Qwen-2.5 (quantized, WASM/WebGPU)
- Runs in a Web Worker to keep the UI responsive
- Prompted to only answer questions relevant to Josh's professional background

---

## Contact Form

Uses [Formspree](https://formspree.io/) for serverless email delivery. Replace `YOUR_FORM_ID` in `ContactForm.vue` with your actual Formspree form ID.

---

## Linting

Linting is handled by **[ESLint 10](https://eslint.org/)** using the flat config format (`eslint.config.ts`), with full TypeScript and Vue 3 support.

```sh
# Check for lint errors
npm run lint

# Check and auto-fix
npm run lint:fix
```

### Rule sets
| Plugin | Preset |
|---|---|
| `@eslint/js` | `recommended` |
| `typescript-eslint` | `recommended` |
| `eslint-plugin-vue` | `flat/recommended` (Vue 3) |

### Key custom rules
| Rule | Setting |
|---|---|
| `@typescript-eslint/consistent-type-imports` | error — enforces `import type` for type-only imports |
| `vue/multi-word-component-names` | off — single-word component names are intentional |
| `vue/component-api-style` | error — enforces `<script setup>` |
| `no-console` | warn — allows `console.warn` and `console.error` |
| `eqeqeq` | error — no `==`, only `===` |

> Lint runs automatically as the first step of `npm run build` — the build fails fast if any errors are found.

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
│   └── useAiState.spec.ts    # shared ref initialisation and mutation
├── data/
│   └── resumeContext.spec.ts # content sanity checks
└── services/
    └── webllm.spec.ts        # buildSystemPrompt, clearHistory, askQuestion guard
```

> **Note:** `webllm.ts` and `webllm.worker.ts` are excluded from coverage because they depend on WebGPU/Worker APIs not available in jsdom. `@mlc-ai/web-llm` is mocked in the service tests.

---

## Trademark Notice

TestNav is a trademark of Pearson Education, Inc. All product names referenced on this site are used for identification purposes only.
