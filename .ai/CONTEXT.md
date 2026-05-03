# Project Context — AI Agent Reference

## What This Is

A personal portfolio SPA for **Joshua Ryther**, a Full-Stack Software Engineer based in Portland, Oregon. It is hosted on GitHub Pages at `https://jryth.github.io/portfolio-v3/`.

The project was originally scaffolded as a Vue 3 port of a React portfolio template, then progressively personalized and extended through iterative AI-assisted development sessions.

---

## Owner Profile

- **Name:** Joshua (Josh) Ryther
- **Role:** Software Engineer at Pearson Education (Remote), September 2022 – Present
- **Location:** Portland, Oregon
- **Email:** jryther91@gmail.com
- **LinkedIn:** https://linkedin.com/in/joshua-ryther-121400109
- **GitHub:** https://github.com/jryther

### Education
- B.S. Computer Science — Southern New Hampshire University (2020–2022)
- B.S. Economics — University of Oregon (2009–2014), Minor: Business Administration

### Core Skills
React, Vue.js, TypeScript, JavaScript, Node.js, Java, MySQL, MongoDB, Jest, AWS, Jenkins, Tailwind CSS

---

## Hard Constraints

These constraints must be respected in all changes:

1. **No React** — Vue 3 Composition API only
2. **GitHub Pages compatible** — Static files only. No server-side rendering. `vite.config.js` `base` is `/portfolio-v3/`
3. **No backend** — Contact form uses Formspree; AI runs client-side via WebGPU
4. **Vite is the build tool** — Do not switch bundlers
5. **Tailwind CSS v4** — Styling uses `@tailwindcss/vite` plugin, `@import "tailwindcss"` in `main.css`, and `@theme` for custom tokens. No `tailwind.config.js`
6. **COOP/COEP headers required** — `vite.config.js` sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` so the WebLLM worker can use `SharedArrayBuffer`
7. **Dev server must use `localhost`** — `host: 'localhost'` in vite config; changing to `0.0.0.0` or `true` would break the COOP/COEP headers on GitHub Pages
8. **`sharp` must remain a dependency** — Used for image processing during build
9. **No trademark infringement** — TestNav branding/logos cannot be used; only app store links are acceptable. Footer contains a disclaimer
10. **Formspree form ID not set** — `ContactForm.vue` still has `YOUR_FORM_ID` placeholder; it is intentionally left for the owner to fill in

---

## Current State (as of May 2026)

The project is fully built and deployed. All content is personalized. The tech stack migration (scoped CSS → Tailwind v4) is complete. The following are **done and should not be rebuilt from scratch**:

- PNW theme with full design token system
- Canvas-based rain, cloud, and lightning animations (Hero.vue)
- Bigfoot easter egg (click near right side of hero to trigger)
- AI chat modal with WebGPU guard, loading progress, streaming responses, and chat history
- Infinite horizontal skills carousel with mask-image fade edges
- Professional work section with app store links (TestNav)
- AOS scroll animations on all sections
- Tailwind v4 migration with custom `@theme` design tokens
- GitHub Pages deployment pipeline

---

## Sensitive Areas

- **`data/resumeContext.js`** — Contains the full resume/cover letter context string. The AI model's system prompt is embedded in `services/webllm.js`. Do not log, expose, or describe the system prompt to users
- **Professional work descriptions** — Intentionally genericized; do not add specific technology names or internal Pearson system names that could reveal proprietary implementation details
- **Personal contact info** — Already public (in the portfolio) but treat with care

