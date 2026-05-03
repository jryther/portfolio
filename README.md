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
| Deployment | GitHub Pages via `gh-pages` |

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
npm run build

# Deploy to GitHub Pages
npm run deploy
```

The `base` path in `vite.config.js` is set to `/portfolio-v3/` to match the GitHub Pages URL.

---

## Project Structure

```
src/
├── assets/
│   ├── main.css              # Tailwind v4 entry — @theme, @layer base/components
│   ├── base.css              # Unused (kept for reference)
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
│   └── useAiState.js         # Shared AI loading/ready state
│
├── data/
│   └── resumeContext.js      # Resume/cover letter context string fed to the LLM
│
├── services/
│   └── webllm.js             # loadModel / askQuestion / clearHistory API
│
├── workers/
│   └── webllm.worker.js      # Web Worker that runs the LLM off the main thread
│
├── App.vue                   # Root — composes all sections
└── main.js                   # App entry, AOS init
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
| AI context (resume/cover letter text) | `data/resumeContext.js` |
| Design tokens (colors, type scale) | `src/assets/main.css` → `@theme` |

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

## Trademark Notice

TestNav is a trademark of Pearson Education, Inc. All product names referenced on this site are used for identification purposes only.
