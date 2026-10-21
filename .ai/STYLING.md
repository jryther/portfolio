# Styling System — AI Agent Reference

## Overview

Styling is **plain CSS — no framework**. There are two places styles live:

1. **`src/styles/main.css`** — the one global stylesheet, imported in `main.ts`. It holds the design tokens (CSS custom properties), a reset, base element styles, and the small set of shared classes used across components (`.wrap`, `.button`, `.card`, …)
2. **`<style scoped>` in each component** — everything specific to that component. Templates use semantic class names (`.featured-title`, `.chat-card-header`), never utility classes

Rule of thumb: if a style is used by one component, it goes in that component's scoped block. Only promote something to `main.css` when several components genuinely share it.

Design direction: modern, dark, engineering-focused, with a Pacific Northwest identity — wet basalt backgrounds, Douglas-fir greens, and **one** sunset-amber accent. Mono type carries the "software engineer" voice (eyebrows, dates, tags).

### Cascade layers

`main.css` declares `@layer reset, base, components;`. Scoped component styles are **unlayered**, so they always beat anything global — a component can override a shared class just by adding its own class:

```html
<a class="button-ghost resume-btn">Resume</a>
```
```css
/* scoped */
.resume-btn { padding: 0.9rem 1.4rem; font-size: 1.4rem; }
```

Two things in `main.css` are deliberately unlayered: the AOS overrides (so they beat `aos.css`) and the `prefers-reduced-motion` block.

---

## Design Tokens

All tokens are custom properties on `:root`, in `@layer base`. Use them as `var(--token)`.

### Colors

| Token | Value | Usage |
|---|---|---|
| `--color-charcoal` | `#0B1012` | Page background — wet basalt at dusk |
| `--color-surface` | `#121A1C` | Cards, inputs |
| `--color-surface-2` | `#18221F` | Raised / hovered surfaces |
| `--color-panel` | `#111819` | AI chat panel |
| `--color-forest` | `#1F3D33` | Douglas fir — surfaces and borders only, never text |
| `--color-slate-pnw` | `#1A2C2E` | Rainy-sky teal |
| `--color-moss` | `#5E8C6A` | Secondary accent: success states, check icons, status dot |
| `--color-amber` | `#E3A867` | **The** accent — CTAs, links, eyebrows, highlights. Use sparingly |
| `--color-golden` | `#EEBD82` | Amber hover |
| `--color-ember` | `#D99A5B` | Warnings |
| `--color-snow` | `#E8EEEA` | Primary text |
| `--color-mist` | `#9FB0AA` | Secondary text (body copy) |
| `--color-ash` | `#7F918B` | Tertiary text, captions, labels |
| `--color-smoke` | `#5F706A` | Placeholders, separators, disabled |
| `--color-ink` | `#0B1012` | Dark text on amber |
| `--color-line` | `rgb(232 238 234 / 0.08)` | Default hairline border |
| `--color-line-strong` | `rgb(232 238 234 / 0.16)` | Hover / emphasized border |

Rule of thumb: if more than one or two things per screen are amber, something should be `snow` or `mist` instead.

### Themes (dark default, light = summer sun)

- `<html data-theme="dark|light">` — set before first paint by an inline script in `index.html`, then managed by `src/composables/useTheme.ts` (`theme`, `setTheme`, `toggleTheme`; persisted under `localStorage['theme']`). Dark is always the default; the OS preference is intentionally ignored
- The values above are the dark palette. `:root[data-theme="light"]` in `main.css` remaps the **same token names by role** — `--color-snow` is still "primary text" (now `#13201C`), `--color-charcoal` is still "page background" (`#F5F3EC`), `--color-amber` is still the accent (`#9A4F0E`, AA on the light background), `--color-ink` becomes white
- So: **never hard-code a colour that should flip**. Use tokens, and `color-mix(in srgb, var(--color-snow) 5%, transparent)` for translucent tints (not `rgb(232 238 234 / x)` or white with alpha)
- `useTheme` adds `.theme-transition` to `<html>` for ~900ms while switching, which fades background/colour/border changes everywhere except the hero (the hero runs its own 1.8s scene transition)
- Icons: `components/icons/UiIcon.vue` (paths in `uiIcons.ts`) — line icons on a 24px grid, round caps, `currentColor`, matching the contact icons. Use these instead of emoji or text glyphs. Size them with a class from the parent's scoped styles (`<UiIcon class="clear-icon" />`) — a child component's root element picks up the parent's scoped styles
- In scoped component styles, target light mode with `:root[data-theme="light"] .my-class { … }` — **not** `:global(...)`, which makes Vue drop the rest of the selector

### Fonts

| Token | Stack | Usage |
|---|---|---|
| `--font-sans` | Inter → system UI | Everything by default |
| `--font-mono` | JetBrains Mono → system mono | Eyebrows, dates, chips/tags, form labels, coordinates |

Loaded from Google Fonts in `index.html` (Inter 400–700, JetBrains Mono 400–500).

### Typography Scale

`html { font-size: 62.5% }` makes `1rem = 10px` (kept because AiChat sizing depends on it). There is **no** extra font shrink on mobile — use `clamp()` for fluid display sizes instead.

Each size from `xs` to `4xl` has a matching `--leading-*` line height. Use them as a pair:

```css
font-size: var(--text-base);
line-height: var(--leading-base);
```

| Size token | Value | Pixels | Line height token |
|---|---|---|---|
| `--text-2xs` | `1.1rem` | 11px | — (inherits) |
| `--text-xs` | `1.2rem` | 12px | `--leading-xs` (1.333) |
| `--text-sm` | `1.3rem` | 13px | `--leading-sm` (1.429) |
| `--text-base` | `1.5rem` | 15px | `--leading-base` (1.5) |
| `--text-body` | `1.6rem` | 16px — standard body text | — (inherits) |
| `--text-lg` | `1.8rem` | 18px | `--leading-lg` (1.556) |
| `--text-xl` | `2rem` | 20px | `--leading-xl` (1.4) |
| `--text-2xl` | `2.4rem` | 24px | `--leading-2xl` (1.333) |
| `--text-3xl` | `3rem` | 30px | `--leading-3xl` (1.2) |
| `--text-4xl` | `4.2rem` | 42px | `--leading-4xl` (1.111) |

Display sizes (`.section-title`, hero name) use `clamp()`.

### Spacing

No spacing scale — write lengths in rem directly (`1rem = 10px`). Existing code mostly uses multiples of `0.25rem` (2.5px).

### Breakpoints

Media queries can't read custom properties, so breakpoints are written out in px:

| Name | Width | Mobile-first | Desktop-first |
|---|---|---|---|
| xs | 480px | `@media (min-width: 480px)` | `@media (width < 480px)` |
| sm | 640px | `@media (min-width: 640px)` | `@media (width < 640px)` |
| md | 768px | `@media (min-width: 768px)` | `@media (width < 768px)` |
| lg | 1024px | `@media (min-width: 1024px)` | `@media (width < 1024px)` |

Some older scoped blocks use `max-width: 768px` (inclusive); that's fine to leave.

---

## `@layer reset`

Replaces the browser defaults: `box-sizing: border-box`, zero margins/padding, `border: 0 solid` (so `border-top-width: 1px` alone draws a line), headings inherit size/weight, lists unstyled, `img`/`svg`/`canvas` are `display: block`, and form controls inherit font and colour with a transparent background.

## `@layer base`

- Tokens on `:root`, light-theme remap on `:root[data-theme="light"]`, `.theme-transition`
- `body`: Inter, 16px, `line-height: 1.6`, charcoal background, snow text
- Headings: `letter-spacing: -0.02em`, `line-height: 1.15`
- `:focus-visible`: 2px amber outline, 3px offset
- `::selection`: translucent amber

---

## `@layer components` — Shared Classes

| Class | What it is |
|---|---|
| `.sr-only` | Visually hidden, still read by screen readers |
| `.skip-link` | "Skip to content" link, hidden until focused |
| `.wrap` | Centered content column — `max-width: 112rem`, `padding-inline: 2.4rem` |
| `.section` | Section vertical rhythm — `padding-block: 12rem` (8rem ≤ 768px) |
| `.eyebrow` | Mono, uppercase, amber label with a trailing hairline, e.g. `01 — About` |
| `.section-title` | Large tight heading — `clamp(3rem, 4.2vw, 4.4rem)`, weight 650 |
| `.lede` | Body copy under a section title — 16px, `line-height: 1.8`, `mist`. Space consecutive ones locally (`.lede + .lede`) |
| `.label` | Small mono uppercase caption, 0.12em tracking, `ash`, 12px. Add `.is-small` for 11px |
| `.progress-track` / `.progress-bar` | Thin amber progress bar; set the bar's `width` inline |
| `.button` | Primary CTA — amber fill, ink text, 8px radius; hover → golden. No lift/shadow |
| `.button-ghost` | Secondary — transparent, `line-strong` border; hover → amber border + text |
| `.chip` | Mono tag — hairline border, 6px radius, `mist` text |
| `.card` | `surface` background, `line` border, 12px radius |
| `.spotlight` | Add to a `.card`: cursor-following amber glow. Set `--mx` / `--my` on `mousemove` (see `Project.vue` `trackPointer`) |
| `.bg-topo` | Topographic contour background (`topo.svg` dark, `topo-light.svg` light) — used on About and Contact |
| `.field` | Form input / textarea — surface fill, hairline border, amber focus ring |

Adjust a shared class for one spot by pairing it with a scoped class (see **Cascade layers** above).

---

## Section Pattern

```html
<section id="x" class="section">
  <div class="wrap">
    <p class="eyebrow">04 — Work</p>
    <h2 class="section-title x-title">Professional work</h2>
    ...
  </div>
</section>
```
```css
/* scoped */
.x-title { margin-top: 1.5rem; margin-bottom: 3.5rem; }
```

Content is left-aligned. Sections are numbered 01–06 in page order (05 — Ask is the chat section).

---

## Motion

- AOS: `data-aos="fade-up"` only, delays ≤ ~240ms. Travel distance is overridden to 12px (unlayered rule in `main.css` so it beats `aos.css`)
- Hover states change color/border only — no `translateY` hops
- `prefers-reduced-motion: reduce` collapses all CSS animations/transitions, disables AOS, stops hero rain and lightning, and freezes clouds (theme switches apply instantly). The header also has a visitor pause/play icon for the hero scene (WCAG 2.2.2, `SceneToggle.vue`)
- Lightning must stay below the WCAG 2.3.1 flash threshold — see FEATURES.md §1 before touching `.sky-flash` or `PULSE`
- `<Transition>` classes (`.fab-enter-active`, …) live in the component's scoped block, **after** the element's own rules, so their `transition` wins while entering/leaving
