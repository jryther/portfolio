# Project Context — AI Agent Reference

## What This Is

A personal portfolio SPA for **Joshua Ryther**, a Full-Stack Software Engineer based in Salem, Oregon. It is hosted on Cloudflare Pages at `https://joshryther.com` (custom domain; the Pages project's own URL is `portfolio-v3-fji.pages.dev`).

The project was originally scaffolded as a Vue 3 SPA, then progressively personalized and extended through iterative AI-assisted development sessions.

---

## Owner Profile

- **Name:** Joshua (Josh) Ryther
- **Role:** Software Engineer at Pearson Education (Remote), September 2022 – Present
- **Location:** Salem, Oregon
- **Email:** jryther91@gmail.com
- **LinkedIn:** https://linkedin.com/in/joshua-ryther-121400109

### Education
- B.S. Computer Science — Southern New Hampshire University (2020–2022)
- B.S. Economics — University of Oregon (2009–2014), Minor: Business Administration

### Core Skills
React, Vue.js, TypeScript, JavaScript, Node.js, Java, MySQL, MongoDB, Jest, AWS, Jenkins, Tailwind CSS

---

## Hard Constraints

These constraints must be respected in all changes:

1. **No React** — Vue 3 Composition API only
2. **Cloudflare Pages deployment** — Static files only. No server-side rendering. `vite.config.ts` `base` is `/`
3. **No backend** — The contact form opens the visitor's email app (`mailto:`); the AI chat runs client-side (wllama, CPU)
4. **Vite is the build tool** — Do not switch bundlers
5. **Plain CSS, no framework** — One global stylesheet (`src/styles/main.css`: tokens, reset, base, shared classes) imported in `main.ts`; everything component-specific goes in that component's `<style scoped>`. Do not add Tailwind or another CSS framework
6. **COOP/COEP headers required** — `public/_headers` sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` so wllama can use `SharedArrayBuffer` for multi-threading. Dev server mirrors these in `vite.config.ts`
7. **Dev server uses `localhost`** — `host: 'localhost'` in vite config: SharedArrayBuffer and the model cache need a secure context, and plain HTTP on a network IP isn't one. To test on other devices use `npm run dev:lan` (mode `lan`: `host: true` plus a self-signed HTTPS certificate from `@vitejs/plugin-basic-ssl`), not a plain `host: true`
8. **No trademark infringement** — TestNav branding/logos cannot be used; only app store links are acceptable. Footer contains a disclaimer

---

## Current State (as of October 2026)

The project is fully built and deployed. All content is personalized. Styling was migrated off Tailwind v4 to plain global + scoped CSS (Oct 2026). The following are **done and should not be rebuilt from scratch**:

- PNW theme with full design token system
- Dark / light themes (`useTheme`, header toggle, saved to localStorage, dark by default) — dusk storm vs. summer sun hero scene
- Canvas rain + clouds, ambient lightning, Bigfoot hiding in the treeline (Hero.vue)
- AI chat (floating popup + full-page "Ask" section): decision tree of pre-written answers, routed by keywords and an optional in-browser embedding model
- English + Spanish (`vue-i18n`), language toggle in the header
- Resume as PDF and Word from a format menu (`ResumeMenu.vue`)
- Skills grid grouped by category; experience & education timeline
- Professional work section with app store links (TestNav)
- AOS scroll animations on all sections
- 2026 redesign: cooler PNW palette, Inter + JetBrains Mono, SVG Mount Hood hero, bento work grid, reduced-motion support
- Plain CSS: design tokens as custom properties in `main.css`, component styles in `<style scoped>`
- Cloudflare Pages deployment (auto-deploy on push to `main`, build command `npx vite build`)
- GitHub Actions CI on pull requests (`.github/workflows/ci.yml`: lint, type check, unit tests, build, Playwright e2e) with Dependabot patch/minor auto-merge

---

## Sensitive Areas

- **`data/chatTree.ts`** — Every chat answer ships publicly. Answers are written from a private source document (never copied into the repo) and reviewed before publishing; `chatRouter.spec.ts` guards some of this. Re-run `npm run embed:topics` after changing labels or examples
- **Professional work descriptions** — Intentionally genericized; do not add specific technology names or internal Pearson system names that could reveal proprietary implementation details
- **Personal contact info** — Already public (in the portfolio) but treat with care

