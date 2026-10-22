# Josh Ryther — Portfolio v3

Personal portfolio website for Josh Ryther, Full-Stack Software Engineer based in Salem, Oregon.
Live at **[joshryther.com](https://joshryther.com)**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API) |
| Build tool | Vite 8 |
| Styling | Plain CSS — a global stylesheet plus scoped `<style>` per component |
| Animations | AOS (Animate On Scroll) + Canvas 2D |
| AI chat | Decision tree of pre-written answers + [wllama](https://github.com/ngxson/wllama) (llama.cpp in WebAssembly) running Google EmbeddingGemma in the browser |
| Testing | Vitest + `@vue/test-utils`, Playwright (end-to-end) |
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
- **English / Spanish** — `vue-i18n`; Spanish-language browsers get Spanish, and a header toggle switches (choice remembered)
- **Resume** — PDF and Word versions from a format menu in the header, hero, and About section
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
# Production build (runs lint + type check + unit tests + vite build, outputs to dist/)
npm run build

# Type-check the app, the e2e specs and vite.config.ts
npm run type-check
```

Every pull request into `main` runs CI (`.github/workflows/ci.yml`): `npm ci`, `npm audit signatures`, `npm audit`, lint, type check, unit tests, one `vite build`, and the Playwright tests against that build. Dependabot patch/minor updates are merged automatically once those checks pass (majors and wllama wait for review).

Cloudflare Pages auto-deploys on every push to `main`. The build command (`npx vite build`, since CI has already run lint and tests) and output directory (`dist`) are configured in the Cloudflare Pages dashboard. Production response headers (COOP/COEP for the AI model, plus basic security headers) are in `public/_headers`.

---

## Project Structure

```
src/
├── __tests__/                # Vitest unit tests (see Testing below)
│
├── styles/
│   └── main.css              # Global styles — tokens, reset, base, shared classes
│
├── assets/
│   ├── Resume.pdf
│   ├── Resume.docx
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
│   ├── LanguageToggle.vue    # English/Spanish switch
│   ├── ResumeMenu.vue        # Resume button + PDF/Word format menu
│   ├── About.vue             # Bio, timeline, skills grid, resume
│   ├── Project.vue           # Professional work: TestNav case study + supporting work
│   ├── ChatSection.vue       # Full-page "Ask" chat + how it works
│   ├── Contact.vue           # Contact links + form card
│   ├── ContactForm.vue       # Email form (opens the visitor's email app)
│   ├── Footer.vue            # One-line footer + trademark disclaimer
│   ├── Notices.vue           # Toast notices for errors with no place of their own
│   ├── icons/                # UiIcon (line icons) + SparkleIcon
│   └── AiChat/
│       ├── AiChat.vue        # Floating chat button + popup
│       ├── ChatHeader.vue    # Title bar shared by the popup and the section
│       ├── ChatPanel.vue     # Messages, chips, model status, input (used by both)
│       ├── MiniGame.vue      # Flappy-style mini-game behind the chat's game icon
│       ├── lazyMiniGame.ts   # Lazy-loads MiniGame (one retry)
│       └── GameLoadError.vue # Shown if the game can't load
│
├── game/
│   ├── flappySim.ts          # Fixed-step game simulation (frame-rate independent)
│   ├── flappyRender.ts       # Themed canvas renderer with cached parallax layers
│   └── flappyAudio.ts        # Procedural Web Audio music and sound effects
│
├── composables/
│   ├── useChat.ts            # The shared chat conversation and model state
│   ├── useGame.ts            # "A round is in play" flag (pauses the hero scene)
│   ├── useTheme.ts           # Dark/light theme state + persistence
│   └── useScene.ts           # Hero animation pause state
│
├── directives/
│   └── tooltip.ts            # v-tooltip: accessible styled tooltips
│
├── i18n/
│   ├── en.ts / es.ts         # UI text (es is typed against en)
│   ├── locales.ts            # Supported languages + browser detection
│   └── index.ts              # vue-i18n setup, setLocale()
│
├── data/
│   ├── chatTree.ts           # Chat decision tree: topics, keywords, examples, answers
│   ├── chatTree.es.ts        # Spanish answers and labels
│   └── topicVectors.json     # Precomputed topic embeddings (npm run embed:topics)
│
├── services/
│   ├── chatRouter.ts         # Keyword routing + "tell me more"
│   ├── topicIndex.ts         # Embedding similarity, vector storage
│   ├── chatModel.ts          # Model name, URL, size
│   ├── wllama.ts             # Loads the model, embeds questions
│   └── errors.ts             # Logging, error handling, toast notices
│
├── App.vue                   # Root — composes all sections
└── main.ts                   # App entry, AOS init

e2e/                          # Playwright end-to-end tests (see Testing below)

scripts/
└── embed-topics.mjs          # Regenerates src/data/topicVectors.json in headless Chrome

public/
├── og-image.png              # Link preview image (1200×630)
└── _headers                  # Cloudflare Pages response headers (COOP/COEP, security, caching); dev and preview read it too
```

---

## Customization

Page text lives in the locale files (`src/i18n/en.ts` and `es.ts`, kept in step); structure, links and lists live in the Vue components. Key locations:

| What | Where |
|---|---|
| All UI text, in both languages | `src/i18n/en.ts`, `src/i18n/es.ts` |
| Name, tagline, social links | `Hero.vue` |
| Bio, education, experience, skills | `About.vue` |
| Professional work (case study, stat tiles, supporting cards) | `Project.vue` |
| Contact email, LinkedIn | `src/data/contact.ts` (used by the hero, contact section, form and footer) |
| Location | `Contact.vue` |
| Footer links | `Footer.vue` |
| Resume files | `src/assets/Resume.pdf`, `Resume.docx` (menu in `ResumeMenu.vue`) |
| AI chat answers, keywords, example questions | `data/chatTree.ts` + `data/chatTree.es.ts` (then `npm run embed:topics`) |
| Design tokens (colors, type scale) | `src/styles/main.css` → `:root` custom properties |

---

## AI Chat — Important Notes

- Nothing is generated: every reply is written in `src/data/chatTree.ts`, so it can't make things up
- Topic chips and keyword matching work instantly, with no download
- For free-form questions, visitors can load Google EmbeddingGemma 300M (~330 MB, cached after the first visit). It runs on the CPU through wllama in a worker, so there's no GPU shader compile and no WebGPU requirement
- **After changing topic labels or example questions, run `npm run embed:topics`** (needs Node 22+ and Chrome; set `CHROME_PATH` if Chrome isn't in the default location). A test fails if the stored vectors are out of date
- The answers are written from a private source document kept outside the repo and reviewed before publishing, since `chatTree.ts` ships publicly

---

## Contact Form

No server or form service: sending opens the visitor's email app with a message to `CONTACT_EMAIL` (`src/data/contact.ts`), the subject and text already filled in. The text stays in the form, and the address is shown as a fallback in case no email app opens.

---

## Testing

Tests are written with **[Vitest](https://vitest.dev/)** and **[@vue/test-utils](https://test-utils.vuejs.org/)**, running in a `jsdom` environment. Vitest shares `vite.config.ts` directly so no separate babel/transform config is needed.

```sh
# Watch mode (re-runs on file save)
npm test

# Single run (CI-friendly)
npm run test:run

# Single run with coverage report (CI runs this one)
npm run test:coverage
```

Coverage reports are written to `coverage/` (HTML at `coverage/index.html`). The run fails if coverage drops below the thresholds in `vite.config.ts`.

### Test structure

```
src/__tests__/
├── components/
│   ├── About.spec.ts         # timeline bullets, in both languages
│   ├── AiChat.spec.ts        # chat popup focus, back to top, stepping aside for the section
│   ├── ContactForm.spec.ts   # the mailto: link, the note after sending
│   ├── Header.spec.ts        # phone menu, current section
│   ├── Hero.spec.ts          # contact links, pause and reduced motion
│   ├── lazyMiniGame.spec.ts  # one quiet retry, then the error
│   ├── MiniGameSound.spec.ts # sound failure handling, key handling
│   ├── Notices.spec.ts       # toast notices
│   └── ResumeMenu.spec.ts    # menu button keys, view vs download
├── composables/
│   ├── useChat.spec.ts       # recovering from a failed answer
│   ├── useScene.spec.ts      # hero pause state
│   └── useTheme.spec.ts      # default/restore/toggle/persist behaviour
├── directives/
│   └── tooltip.spec.ts       # v-tooltip show/hide/dismiss
├── game/
│   ├── flappyAudio.spec.ts   # mute/unmute, theme switch, hidden tab (fake Web Audio)
│   ├── flappyRender.spec.ts  # canvas sizing, what each frame draws (recording 2D context)
│   └── flappySim.spec.ts     # frame-rate independence, determinism, autopilot
├── i18n/
│   ├── firstPaint.spec.ts    # index.html's inline language/theme scripts match the app
│   └── messages.spec.ts      # English/Spanish key parity, messages compile
└── services/
    ├── chatRouter.spec.ts    # tree integrity, keyword routing, "tell me more"
    ├── errors.spec.ts        # logging, notices, global error handlers
    └── topicIndex.spec.ts    # vector storage, similarity ranking, stale-vector check
```

> **Note:** `services/wllama.ts` is excluded from coverage because it needs WebAssembly workers and a real model, which jsdom can't run. The routing logic it relies on lives in `chatRouter.ts` and `topicIndex.ts`, which are tested.

### End-to-end tests

**[Playwright](https://playwright.dev/)** drives the whole page in Chromium, at desktop size and as a phone (Pixel 7). Locally it starts its own Vite dev server on port 5180; in CI (`CI` set) it runs against the production build with `vite preview` on the same port.

```sh
# First time only: download the browser
npx playwright install chromium

# Run everything headless
npm run test:e2e

# Interactive UI mode (watch, time-travel debugging)
npm run test:e2e:ui

# Open the HTML report from the last run
npm run test:e2e:report
```

The page runs offline in these tests: Google Fonts and the Hugging Face model are blocked (`e2e/fixtures.ts`), and tests that need them mock the response. Nothing downloads the ~330 MB model. Tests run with reduced motion so the page is deterministic (no AOS, no weather, instant chat replies); specs that cover motion-only UI turn it back off.

```
e2e/
├── fixtures.ts               # offline network, page helpers, chat locators
├── page-content.spec.ts      # every section's content, links, downloads, no errors or broken assets
├── navigation.spec.ts        # header nav, active section, phone menu, skip link, back to top
├── preferences.spec.ts       # theme, language (incl. Spanish browsers) and animation toggles, persisted
├── chat.spec.ts              # popup + section chat, chips, keyword answers, model loading/error states
├── mini-game.spec.ts         # game toggle, play to game over, best score, sound, keyboard focus
├── contact-form.spec.ts      # validation, successful send, server and network failures
├── resume-menu.spec.ts       # resume format menu: keyboard, mouse, links
└── tooltips.spec.ts          # tooltips on hover, keyboard focus, Escape, touch
```

These aren't part of `npm run build` (the Cloudflare build has no browser); CI runs them on every pull request.

---

## Trademark Notice

TestNav is a trademark of Pearson Education, Inc. All product names referenced on this site are used for identification purposes only.
