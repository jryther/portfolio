# Styling System — AI Agent Reference

## Overview

Styling uses **Tailwind CSS v4** (`@tailwindcss/vite` plugin). There is **no `tailwind.config.js`** — all customization lives in `src/assets/main.css` via `@theme`, `@layer base`, and `@layer components`.

---

## `@theme` — Custom Design Tokens

### Colors

| Token | Value | Usage |
|---|---|---|
| `forest` | `#2D5016` | Primary backgrounds, borders — deep evergreen |
| `amber` | `#D4A574` | Headings, accents, interactive elements — warm wood |
| `moss` | `#4A7C59` | Hover states — forest floor green |
| `slate-pnw` | `#1F3A3A` | Deep slate/teal — rainy sky |
| `golden` | `#E8B559` | Golden hour accent — button hover |
| `charcoal` | `#0F1419` | Page background — night sky |
| `snow` | `#F5F5F5` | Primary text — forest light |
| `mist` | `#C4C4C4` | Secondary text — shaded |
| `ash` | `#aaaaaa` | Tertiary text, captions |
| `smoke` | `#888888` | Placeholder text, disabled |
| `ember` | `#c49550` | Warning text in AI chat |
| `ink` | `#1a1a1a` | Dark text on light backgrounds (AI user bubble) |
| `panel` | `#1a1e2a` | AI chat panel background |

**Usage in Tailwind:**
```html
<!-- Background -->
<div class="bg-forest">           <!-- solid -->
<div class="bg-forest/[.12]">     <!-- 12% opacity -->
<div class="bg-forest/40">        <!-- 40% opacity -->

<!-- Text -->
<p class="text-amber">
<p class="text-snow">

<!-- Border -->
<div class="border border-amber/45">
```

### Typography Scale

All sizes are in `rem` relative to `html { font-size: 62.5% }` which makes `1rem = 10px`.

| Token | Value | Pixels | Usage |
|---|---|---|---|
| `text-2xs` | `0.9rem` | 9px | Tiny badges |
| `text-xs` | `1rem` | 10px | Small meta labels |
| `text-sm` | `1.2rem` | 12px | Captions, list items |
| `text-base` | `1.4rem` | 14px | Small body, cards |
| `text-body` | `1.6rem` | 16px | **Standard body text** |
| `text-lg` | `1.8rem` | 18px | Card titles, sub-headings |
| `text-xl` | `2rem` | 20px | Section sub-headings |
| `text-2xl` | `2.4rem` | 24px | Medium headings |
| `text-3xl` | `3rem` | 30px | Section headings (`h2`) |
| `text-4xl` | `4.2rem` | 42px | Large headings |

> **Hero heading** uses `clamp(3rem, 6.5vw, 5.5rem)` set in `<style scoped>` — cannot be a Tailwind utility.

### Breakpoints

| Token | Value | Pixels (at 16px media query base) |
|---|---|---|
| `xs` | `30rem` | 480px |
| `sm` (default) | `40rem` | 640px |
| `md` (default) | `48rem` | 768px |
| `lg` (default) | `64rem` | 1024px |

**Max-width usage (mobile-first overrides):**
```html
<p class="text-body max-md:text-base max-xs:text-sm">
```

---

## `@layer base` — Global Resets and Body Styles

```css
html  { font-size: 62.5%; scroll-behavior: smooth; scroll-padding-top: 10rem; }
body  { font-size: 1.6rem; background: #0F1419; color: #F5F5F5; font-family: 'Red Hat Display', sans-serif; }
a     { text-decoration: none; color: inherit; }
ul,li { list-style: none; margin: 0; padding: 0; }
/* Responsive font-size: 55% @ 768px, 50% @ 480px */
```

Tailwind Preflight (included via `@import "tailwindcss"`) handles box-sizing, margin/padding resets, and base element normalization.

---

## `@layer components` — Shared Component Classes

### `.button`
Used by: `Hero.vue` (Let's Connect), `About.vue` (Download Resume, Download Cover Letter), `AiChat.vue` (Start Chat, Send)

```css
.button {
  display: inline-flex; align-items: center; justify-content: center;
  background-color: var(--color-forest);  /* #2D5016 */
  color: var(--color-snow);               /* #F5F5F5 */
  border-radius: 2rem;
  font-weight: 500;
  padding: 1rem 2rem;
  font-size: 1.6rem;
  line-height: 1;
  transition: all 0.3s ease;
}
.button:hover {
  background-color: var(--color-moss);   /* #4A7C59 */
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(45, 80, 22, 0.3);
}
```

Individual buttons can override padding/font-size with Tailwind utility classes since `@layer components` has lower specificity than utilities.

---

## Scoped Styles Kept in Components

| Component | What's Kept | Why |
|---|---|---|
| `Header.vue` | `.nav` mobile max-height transition, `.menu span:nth-child(n)` transforms | `nth-child` and `.active` state toggle can't be expressed as Tailwind utilities |
| `Hero.vue` | `.hero`, `.canvas-layer`, `.hero-text`, `.hero-image`, `.mount-hood`, all `@media` | `clamp()` font sizes, canvas absolute positioning, complex responsive layout |
| `About.vue` | `.skills-carousel` (mask-image), `.skills-track` (@keyframes skills-scroll) | `mask-image` linear gradient, custom `@keyframes` |
| `ContactForm.vue` | `.success-message` animation, `@keyframes slideIn` | Custom `@keyframes` |
| `AiChat.vue` | `.meta-badge`, `.spin-gear`, `@keyframes spin-gear`, `.dot`, `@keyframes typing-bounce`, Vue transition classes | `@keyframes`, `nth-child` animation delays, Vue `<Transition>` class hooks |

---

## Common Patterns

### Section background gradient
```html
<section class="bg-[linear-gradient(135deg,_rgba(45,80,22,0.08)_0%,_rgba(15,20,25,0.9)_100%)]">
```

### Section padding
```html
<section class="py-32 px-[5%] max-md:py-16 max-md:px-8 max-xs:py-8 max-xs:px-4">
```
(`py-32` = `8rem` top/bottom, `px-[5%]` = 5% horizontal)

### Card style
```html
<div class="bg-white/5 border border-forest/40 rounded-2xl p-8 flex flex-col">
```

### Hover border highlight
```html
<div class="... transition-all duration-300 hover:bg-forest/20 hover:border-amber">
```

### Education/experience block with left accent border
```html
<div class="my-8 p-6 bg-forest/[.12] border-l-4 border-amber rounded-lg">
```

### Heading hierarchy
```html
<h2 class="text-3xl text-snow">           <!-- Section heading -->
<h3 class="text-xl text-amber">           <!-- Sub-section heading (amber) -->
<h4 class="text-lg text-snow">            <!-- Card/item heading -->
<p  class="text-body text-mist">          <!-- Body text -->
<p  class="text-base text-ash">           <!-- Secondary/caption text -->
```

---

## Font

**Red Hat Display** — loaded from Google Fonts (referenced in `index.html`). Set as `font-family` on `body` and all form elements in `@layer base`.

