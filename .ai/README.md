# AI Agent Documentation Index

This directory contains machine-readable documentation for AI coding agents working on the `portfolio-v3` repository.

## Files

| File | Contents |
|---|---|
| [`CONTEXT.md`](./CONTEXT.md) | **Start here.** Project identity, owner profile, hard constraints, current state, sensitive areas |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | File structure, component tree, component responsibilities, services, Vite config, asset pipeline |
| [`STYLING.md`](./STYLING.md) | Tailwind v4 setup, full design token reference (colors + type scale + breakpoints), global layers, shared patterns |
| [`FEATURES.md`](./FEATURES.md) | Every interactive feature explained in implementation detail: canvas animations, AI chat, carousel, nav, forms, deployment |

## Recommended Reading Order

1. `CONTEXT.md` — understand who this is for, what's complete, and what must not be changed
2. `ARCHITECTURE.md` — understand the component structure before touching any file
3. `STYLING.md` — reference before adding or changing any CSS or Tailwind classes
4. `FEATURES.md` — reference before modifying canvas animations, AI chat, or any interactive feature

## Key Facts for Quick Reference

- **Framework:** Vue 3 Composition API — no React, no Vue Router
- **Styling:** Tailwind CSS v4 — `@import "tailwindcss"` in `main.css`, custom `@theme`, no `tailwind.config.js`
- **Build:** Vite 7, base path `/portfolio-v3/`, deploys to GitHub Pages
- **AI:** WebLLM (`@mlc-ai/web-llm`) in a Web Worker, WebGPU required, ~740 MB model
- **1 rem = 10 px** (html font-size: 62.5%)
- **Primary accent color:** `#D4A574` (amber) — token `--color-amber`
- **Background:** `#0F1419` (charcoal) — token `--color-charcoal`
- **Forest green:** `#2D5016` — token `--color-forest`

