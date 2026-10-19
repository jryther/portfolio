# Features — AI Agent Reference

## 1. Hero Scene (Hero.vue)

Layer stack inside the hero (all `position: absolute`, `pointer-events: none` — nothing in the scene is clickable):

| Layer | z-index | Content |
|---|---|---|
| `.sky-night` / `.sky-day` | 0 | Dusk and summer-sky gradients, cross-faded by theme (1.8s) |
| `.sky-flash` | 0 | Lightning glow behind the ridgelines (animated with WAAPI) |
| `.mountain` SVG | 1 | Sun, distant bolt, ridgelines, Hood, snowpack, foothills, Bigfoot, foreground firs |
| `cloudCanvas` | 2 | Clouds (storm palette ↔ fair-weather palette) |
| `rainCanvas` | 3 | Rain + splashes |
| `.grain` | 4 | Film-grain overlay |

Hero content and the summit coordinates sit at `z-index: 5`.

### Day / night (theme)
- Driven by `theme` from `composables/useTheme.ts`; a `watch(theme)` calls `cloudController.setDay()`, `rainController.setRaining()` and reschedules lightning
- SVG fills/opacity/transform transition via CSS classes (`.m-far`, `.m-body`, `.m-foot`, `.m-near`, `.night-only`, `.day-only`, `.sun`, `.alpenglow`) with `:root[data-theme="light"] .x` overrides in the scoped styles — **do not** wrap these in `:global()`; Vue drops everything after the `:global()` part and the rule lands on `<html>`
- Light mode: sun rises 300 user units (`.sun` transform), winter snowpack cross-fades to a smaller late-summer cap, ridgelines turn hazy blue / meadow green

### Rain (`initRain`)
- Drop count scales with width (70–170). Each drop has a depth `z` (0 far → 1 near) that sets length (9–23px), speed (1.6–3.8px/frame — a gentle, steady rain), width and opacity (0.12–0.38) for a sense of volume
- Only near drops (`z > 0.55`) splash
- `intensity` eases toward its target (0 or 1) so the rain tapers off over ~2s when switching to light
- The loop stops itself once intensity reaches 0 and splashes finish; `setRaining(true)` restarts it

### Clouds (`initClouds`)
- Two parallax layers (4 far + 3 near; 2 + 2 under 768px), seeded with `mulberry32(42)` so the sky is the same every visit
- **Flat illustrated style** to match the vector ridgelines — no soft gradients. Three kinds (`CLOUD_SHAPES`, picked by `pickKind`): tall **cumulus**, long low **stratus** banks, and small **puffs**, with varied size/aspect
- `makePuffs` builds a scalloped row of round bumps (biggest in the middle) plus crown lumps; `renderCloud` fills their union in the shade tone, then the same shape nudged up-left in the light tone (`source-atop`), leaving shade crescents under each bump. There is deliberately no base slab — everything outside the bumps stays transparent
- Pre-rendered twice (`NIGHT_CLOUDS` slate / `DAY_CLOUDS` white with a cool blue underside) to offscreen canvases
- `dayMix` blends the two caches each frame; when paused (reduced motion / offscreen) `setDay` jumps straight to the target and redraws one frame

### Ambient lightning (dark mode only)
- `scheduleFlash()` fires every 9–20s (first at 4–7s) while `canFlash()`: dark theme, hero visible, scene not paused, no active gameplay, tab visible, no reduced motion
- Each strike is a single soft `PULSE` (~120ms rise, ~1.4s fade — no flicker) on `.sky-flash`; 60% chance of a bolt (`makeBolt()`), drawn **behind** the Hood body so the mountain occludes the strike
- **Photosensitivity (WCAG 2.3.1 / 2.3.2):** measured peak change in sky relative luminance is ≈ 0.04 (dusk sky ≈ 0.008 → ≈ 0.05), below the 0.1 that counts as a flash. The bolt and lit Bigfoot are far smaller than the 25%-of-10° area threshold. If you change `.sky-flash` colours or `PULSE`, keep the peak ΔL < 0.1, keep it to one pulse per strike, and avoid saturated red

### Scene pause (WCAG 2.2.2)
- `SceneToggle.vue` — a quiet icon-only pause/play button in the header, beside the theme toggle (hidden under reduced motion, where the scene is already still). Stops rain, clouds and lightning
- Only present while the hero is on screen: the hero's IntersectionObserver sets `heroInView`, and once the hero scrolls away (the scene auto-pauses anyway) the button collapses to zero width, fades out, and becomes `visibility: hidden` so it leaves the tab order — no dead control and no gap in the header
- State lives in `composables/useScene.ts` (`scenePaused`, `toggleScene`, `heroInView`), persisted in `localStorage['scene-paused']`

### Bigfoot
- Original SVG silhouette (`BIGFOOT` path) standing in a clearing in the foreground treeline (`treeline(..., [1160, 1214])` leaves the gap)
- Dark: `.bf-lit` is lit up during roughly 1 in 3 flashes (always the 2nd)
- Light: `.bf` is a slightly darker green than the firs — hiding in plain sight

### Reduced motion
- No rain, no lightning, clouds frozen; theme changes apply instantly

---

## 2. Skills Grid (About.vue)

- `skillGroups` holds three categories (Frontend, Backend & Data, Testing & DevOps), each rendered as a `.card` of `.chip` items
- Icons are desaturated (`saturate(0.2)`, 75% opacity) and pick up their brand colour on chip hover
- Jenkins uses the official simple-icons mark (`techIcons/jenkins.svg`)

---

## 3. AI Chat Modal (AiChat.vue)

### Visibility Guard
```js
onMounted(() => { webGpuSupported.value = !!navigator.gpu })
```
The entire widget (`v-if="webGpuSupported"`) only mounts if `navigator.gpu` is available. Not present on Firefox, Safari, or devices without a compatible GPU.

### UI States
1. **Pre-load CTA** (`!modelStarted`) — Sparkle icon, description, meta badges, "Start Chat" button
2. **Loading** (`modelStarted && !modelReady`) — Spinning gear, loading bar with `%`, performance warning
3. **Chat** (`modelReady`) — Scrollable message history + input area

### Toggle Behavior
- Toggle button is always in the DOM at the bottom of the flex column
- Chat panel is `position: absolute; bottom: 0; right: 0` — it sits on top of the button via `z-index: 1`
- When panel closes, button naturally reappears from behind
- Vue `<Transition name="chat-panel">` handles slide-up/fade on open/close

### Message Streaming
```js
messages.value.push({ role: 'assistant', text: '' })  // placeholder
const liveIndex = messages.value.length - 1
await askQuestion(question, resumeContext, (chunk) => {
  messages.value[liveIndex].text += chunk  // token streaming
})
```

### First-Response Warning
Shown only when: `thinking && !firstQuestion && !firstResponseStarted && userMessageCount === 1`
Disappears as soon as `firstResponseStarted` becomes true (first token arrives).

### Relevance Filtering
The system prompt in `services/webllm.js` includes two-layer filtering:
1. The model is instructed to check if the question is relevant to hiring Josh as a software engineer
2. If irrelevant, it responds with a canned redirect message
3. If relevant, it answers using only the provided resume context
The system prompt is **not exposed to users**.

---

## 4. AOS Scroll Animations

Initialized in `main.ts`:
```js
AOS.init({ duration: 600, easing: "ease-out-cubic", offset: 60, once: true, disable: () => prefersReducedMotion })
```

All components use `data-aos` attributes:
- `data-aos="fade-up"` — fades in and rises 12px (distance overridden in `main.css`)
- `data-aos-delay="80"` — small stagger in ms; keep delays at or under ~240ms

Animations run once (`once: true`) — do not re-animate on scroll-up.

---

## 5. Responsive Navigation (Header.vue)

**Desktop (> 768px):** Horizontal flex nav (About / Work / Contact + ghost Resume button); the logo links home

**Scroll state:** after 8px of scroll the header gains a blurred translucent background and hairline border (`.scrolled`)

**Active section:** an `IntersectionObserver` (`rootMargin: -40% 0px -55% 0px`) sets `activeId`; the matching link gets `.current` (amber dot on desktop, amber text on mobile) and `aria-current`

**Mobile (≤ 768px):**
- Hamburger button (3 `<span>` lines) appears
- `.nav` collapses to `max-height: 0; overflow: hidden`
- Vue ref `isMenuOpen` toggles `.active` class → `max-height: 400px` CSS transition
- Active state animates spans into × shape via `nth-child` transforms

---

## 6. Contact Form (ContactForm.vue)

- Submits to Formspree via `fetch` POST with JSON body
- `formspreeEndpoint` is currently `'https://formspree.io/f/YOUR_FORM_ID'` — owner must replace
- Success: `submitted` ref shows green success message for 5 seconds then hides
- No client-side validation beyond HTML5 `required` attributes

---

## 7. Document Downloads (About.vue)

Resume and Cover Letter are imported as Vite asset URLs:
```js
import resumeUrl      from '../assets/Resume.pdf'
import coverLetterUrl from '../assets/Cover Letter.docx'
```
Both files get content-hashed filenames in production (`Resume-XXXXX.pdf`).
Buttons use `<a :href="url" download="filename">` — browser-native download.

---

## 8. Professional Work Section (Project.vue)

- TestNav app store links appear above the work cards with Apple and Microsoft SVG icons styled to match the amber theme
- Four work cards — layout only, no interactive links (all `link` and `github` values are `'#'`)
- Cards have no hover lift/transform effect — intentionally informational only
- Achievements use `before:content-['✓']` Tailwind pseudo-element utility

---

## 9. Cloudflare Pages Deployment

```sh
npm run build
```

`npm run build` runs lint → tests → `vite build` in sequence. Cloudflare Pages auto-deploys on every push to `main`.

`public/_headers` sets the required COOP/COEP headers for `SharedArrayBuffer` (WebLLM):
```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: credentialless
```

`vite.config.ts` `base: '/'` ensures all asset paths resolve correctly from the domain root.

