# AI Agent Documentation Index

This directory contains machine-readable documentation for AI coding agents working on the `portfolio-v3` repository.

## Files

| File | Contents |
|---|---|
| [`CONTEXT.md`](./CONTEXT.md) | **Start here.** Project identity, owner profile, hard constraints, current state, sensitive areas |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | File structure, component tree, component responsibilities, services, Vite config, asset pipeline |
| [`STYLING.md`](./STYLING.md) | Global vs scoped CSS, full design token reference (colors + type scale + breakpoints), global layers, shared patterns |
| [`FEATURES.md`](./FEATURES.md) | Every interactive feature explained in implementation detail: canvas animations, AI chat, skills grid, nav, forms, deployment |

## Recommended Reading Order

1. `CONTEXT.md` — understand who this is for, what's complete, and what must not be changed
2. `ARCHITECTURE.md` — understand the component structure before touching any file
3. `STYLING.md` — reference before adding or changing any CSS
4. `FEATURES.md` — reference before modifying canvas animations, AI chat, or any interactive feature

## Key Facts for Quick Reference

- **Framework:** Vue 3 Composition API — no React, no Vue Router
- **Styling:** Plain CSS — global `src/styles/main.css` (tokens, reset, shared classes) + `<style scoped>` per component
- **Build:** Vite 7, base path `/`, deploys to Cloudflare Pages
- **AI chat:** decision tree of pre-written answers (`data/chatTree.ts`); free text routed by keywords, then Google EmbeddingGemma 300M (~330 MB) via wllama on the CPU
- **Languages:** English + Spanish via `vue-i18n` (Composition API). UI text in `src/i18n/en.ts` / `es.ts` (es is typed against en; a test checks key and list parity); chat answers in `data/chatTree.ts` + `data/chatTree.es.ts`. No hardcoded user-facing strings in components
- **1 rem = 10 px** (html font-size: 62.5%)
- **Primary accent color:** `#E3A867` (amber) — the only accent; use sparingly — token `--color-amber`
- **Background:** `#0B1012` (charcoal) — token `--color-charcoal`
- **Fonts:** Inter (`--font-sans`) + JetBrains Mono (`--font-mono`) for labels, dates, and tags

