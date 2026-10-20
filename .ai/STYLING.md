# Styling System — AI Agent Reference

## Overview

Styling uses **Tailwind CSS v4** (`@tailwindcss/vite` plugin). There is **no `tailwind.config.js`** — all customization lives in `src/styles/main.css` via `@theme`, `@layer base`, and `@layer components`.

Design direction: modern, dark, engineering-focused, with a Pacific Northwest identity — wet basalt backgrounds, Douglas-fir greens, and **one** sunset-amber accent. Mono type carries the "software engineer" voice (eyebrows, dates, tags).

---

## `@theme` — Custom Design Tokens

### Colors

| Token | Value | Usage |
|---|---|---|
| `charcoal` | `#0B1012` | Page background — wet basalt at dusk |
| `surface` | `#121A1C` | Cards, inputs |
| `surface-2` | `#18221F` | Raised / hovered surfaces |
| `panel` | `#111819` | AI chat panel |
| `forest` | `#1F3D33` | Douglas fir — surfaces and borders only, never text |
| `slate-pnw` | `#1A2C2E` | Rainy-sky teal |
| `moss` | `#5E8C6A` | Secondary accent: success states, check icons, status dot |
| `amber` | `#E3A867` | **The** accent — CTAs, links, eyebrows, highlights. Use sparingly |
| `golden` | `#EEBD82` | Amber hover |
| `ember` | `#D99A5B` | Warnings |
| `snow` | `#E8EEEA` | Primary text |
| `mist` | `#9FB0AA` | Secondary text (body copy) |
| `ash` | `#7F918B` | Tertiary text, captions, labels |
| `smoke` | `#5F706A` | Placeholders, separators, disabled |
| `ink` | `#0B1012` | Dark text on amber |
| `line` | `rgb(232 238 234 / 0.08)` | Default hairline border |
| `line-strong` | `rgb(232 238 234 / 0.16)` | Hover / emphasized border |

```html
<div class="bg-surface border border-line">
<p class="text-mist">
<span class="text-amber">
```

Rule of thumb: if more than one or two things per screen are amber, something should be `snow` or `mist` instead.

### Themes (dark default, light = summer sun)

- `<html data-theme="dark|light">` — set before first paint by an inline script in `index.html`, then managed by `src/composables/useTheme.ts` (`theme`, `setTheme`, `toggleTheme`; persisted under `localStorage['theme']`). Dark is always the default; the OS preference is intentionally ignored
- The values above are the dark palette (`@theme`). `:root[data-theme="light"]` in `main.css` remaps the **same token names by role** — `snow` is still "primary text" (now `#13201C`), `charcoal` is still "page background" (`#F5F3EC`), `amber` is still the accent (`#9A4F0E`, AA on the light background), `ink` becomes white
- So: **never hard-code a colour that should flip**. Use tokens, or `color-mix(in srgb, var(--color-snow) 5%, transparent)` / `bg-snow/[.05]` for translucent tints (not `rgb(232 238 234 / x)` or `bg-white/x`)
- `useTheme` adds `.theme-transition` to `<html>` for ~900ms while switching, which fades background/colour/border changes everywhere except the hero (the hero runs its own 1.8s scene transition)
- In scoped component styles, target light mode with `:root[data-theme="light"] .my-class { … }` — **not** `:global(...)`, which makes Vue drop the rest of the selector

### Fonts

| Token | Stack | Usage |
|---|---|---|
| `font-sans` | Inter → system UI | Everything by default |
| `font-mono` | JetBrains Mono → system mono | Eyebrows, dates, chips/tags, form labels, coordinates |

Loaded from Google Fonts in `index.html` (Inter 400–700, JetBrains Mono 400–500).

### Typography Scale

`html { font-size: 62.5% }` makes `1rem = 10px` (kept because AiChat sizing depends on it). There is **no** extra font shrink on mobile — use `clamp()` for fluid display sizes instead.

| Token | Value | Pixels |
|---|---|---|
| `text-2xs` | `1.1rem` | 11px |
| `text-xs` | `1.2rem` | 12px |
| `text-sm` | `1.3rem` | 13px |
| `text-base` | `1.5rem` | 15px |
| `text-body` | `1.6rem` | 16px — standard body text |
| `text-lg` | `1.8rem` | 18px |
| `text-xl` | `2rem` | 20px |
| `text-2xl` | `2.4rem` | 24px |
| `text-3xl` | `3rem` | 30px |
| `text-4xl` | `4.2rem` | 42px |

Display sizes (`.section-title`, hero name) use `clamp()`.

### Breakpoints

`xs` = `30rem` (480px) plus Tailwind defaults `sm` 640, `md` 768, `lg` 1024.

---

## `@layer base`

- `body`: Inter, 16px, `line-height: 1.6`, charcoal background, snow text
- Headings: `letter-spacing: -0.02em`, `line-height: 1.15`
- `:focus-visible`: 2px amber outline, 3px offset
- `::selection`: translucent amber

---

## `@layer components` — Shared Classes

| Class | What it is |
|---|---|
| `.wrap` | Centered content column — `max-width: 112rem`, `padding-inline: 2.4rem` |
| `.section` | Section vertical rhythm — `padding-block: 12rem` (8rem ≤ 768px) |
| `.eyebrow` | Mono, uppercase, amber label with a trailing hairline, e.g. `01 — About` |
| `.section-title` | Large tight heading — `clamp(3rem, 4.2vw, 4.4rem)`, weight 650 |
| `.button` | Primary CTA — amber fill, ink text, 8px radius; hover → golden. No lift/shadow |
| `.button-ghost` | Secondary — transparent, `line-strong` border; hover → amber border + text |
| `.chip` | Mono tag — hairline border, 6px radius, `mist` text |
| `.card` | `surface` background, `line` border, 12px radius |
| `.spotlight` | Add to a `.card`: cursor-following amber glow. Set `--mx` / `--my` on `mousemove` (see `Project.vue` `trackPointer`) |
| `.bg-topo` | Topographic contour background (`topo.svg` dark, `topo-light.svg` light) — used on About and Contact |
| `.field` | Form input / textarea — surface fill, hairline border, amber focus ring |

Utilities override these freely (components layer has lower precedence), e.g. `class="button-ghost py-[1rem] px-[1.4rem]"`.

---

## Section Pattern

```html
<section id="x" class="section">
  <div class="wrap">
    <p class="eyebrow">04 — Work</p>
    <h2 class="section-title mt-6 mb-14">Professional work</h2>
    ...
  </div>
</section>
```

Content is left-aligned. Sections are numbered 01–06 in page order (05 — Ask is the chat section).

---

## Motion

- AOS: `data-aos="fade-up"` only, delays ≤ ~240ms. Travel distance is overridden to 12px (unlayered rule in `main.css` so it beats `aos.css`)
- Hover states change color/border only — no `translateY` hops
- `prefers-reduced-motion: reduce` collapses all CSS animations/transitions, disables AOS, stops hero rain and lightning, and freezes clouds (theme switches apply instantly). The header also has a visitor pause/play icon for the hero scene (WCAG 2.2.2, `SceneToggle.vue`)
- Lightning must stay below the WCAG 2.3.1 flash threshold — see FEATURES.md §1 before touching `.sky-flash` or `PULSE`

---

## Scoped Styles Kept in Components

| Component | What's kept | Why |
|---|---|---|
| `Header.vue` | Scrolled/blur state, active-link dot, mobile dropdown, hamburger `nth-child` transforms | Pseudo-elements, state classes |
| `Hero.vue` | Sky layers, `.mountain` sizing + day/night fills, canvas layers, grain, status pill ping, `clamp()` type, responsive rules | Scene transitions, absolute layering, `@keyframes` |
| `About.vue` | Timeline rail/dots, skill-chip icon desaturate → colour hover | Structural pseudo-borders, filters |
| `Contact.vue` | Contact row hover, icon tile | Hover on descendant |
| `ContactForm.vue` | Mono field labels, `.success-message` slide-in | `@keyframes` |
| `AiChat/ChatPanel.vue` | `.topic-chip`, typing dots, `.is-large` sizes | `@keyframes`, prop-driven sizing |
| `AiChat/AiChat.vue` | Popup and floating-button transitions | `<Transition>` hooks |
| `ChatSection.vue` | Responsive grid areas (intro/chat/details), viewport-fitted chat card, steps, facts list | Grid areas, `clamp()` heights |
