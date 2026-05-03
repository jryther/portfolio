# Features — AI Agent Reference

## 1. Canvas Animation System (Hero.vue)

Three `<canvas>` elements stack at `position: absolute; inset: 0` inside the hero section:

| Canvas | z-index | `pointer-events` | Content |
|---|---|---|---|
| `cloudCanvas` | 0 | none | Animated clouds |
| `rainCanvas` | 1 | none | Falling rain + splashes |
| `lightningCanvas` | 2 | all | Lightning bolts + Bigfoot silhouette |

Hero content sits at `z-index: 3`.

### Rain (`initRain`)
- 90 rain drops with randomized `length`, `speed`, `opacity`, `width`
- Angle: `Math.PI / 10` (slightly diagonal, left-to-right)
- Color: `rgba(180, 210, 255, opacity)` — light blue
- Splashes: ellipse + two splash lines drawn when a drop hits `canvas.height - 20`
- `ResizeObserver` keeps canvas sized to section

### Clouds (`initClouds`)
- 4 clouds, evenly spaced horizontally, slow drift right
- Each cloud drawn with layered Bezier paths + radial gradients for realistic shading
- Opacity: `0.08–0.17` range — subtle, ornamental
- Clouds wrap: when `x > canvas.width + 300`, reset to `x = -300`

### Lightning (`initLightning`)
- Triggered by every click on `lightningCanvas` (the `@click="onHeroClick"` handler on the canvas)
- Bolt: randomized segmented path from top of canvas to click point
- Color: two strokes — wide soft blue-white glow + narrow bright core
- `flashes` array: each flash has a `life` counter (70 frames), fading in and out

### Bigfoot Easter Egg
- Fixed logical position: `{ xFrac: 0.78, yFrac: 0.82 }` of canvas dimensions
- Proximity radius: `BIGFOOT_PROXIMITY = 280px`
- If click distance ≤ 280px from Bigfoot's position: silhouette is drawn on the lightning canvas during the flash
- Silhouette: `bigfoot.png` is processed in `buildSilhouette()` — pixels with brightness > 180 become transparent, remaining pixels become muted blue-grey (`rgb(160, 175, 200)`)
- Lightning **always fires** on every click; Bigfoot only appears if click is close enough

---

## 2. Skills Carousel (About.vue)

- Array `skills` (12 items) is duplicated: `[...skills, ...skills]` = 24 items rendered
- CSS animation `skills-scroll` runs `translateX(0)` → `translateX(-50%)` on the track
- Duration: 28 seconds, `linear infinite`
- `mask-image` on the container fades item edges: transparent → black from 0%–6%, black from 6%–94%, black → transparent from 94%–100%
- No hover interactivity (cursor is default, no hover effects) — purely decorative

---

## 3. AI Chat Modal (AiChat.vue)

### Visibility Guard
```js
onMounted(() => { webGpuSupported.value = !!navigator.gpu })
```
The entire widget (`v-if="webGpuSupported"`) only mounts if `navigator.gpu` is available. Not present on Firefox, Safari, or devices without a compatible GPU.

### UI States
1. **Pre-load CTA** (`!modelStarted`) — Robot icon, description, meta badges, "Start Chat" button
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

Initialized in `main.js`:
```js
AOS.init({ duration: 1000, offset: 100, once: true })
```

All components use `data-aos` attributes:
- `data-aos="fade-in-up"` — rises from below on scroll
- `data-aos="fade-in-left"` — slides from left
- `data-aos-delay="200"` — 200ms delay (in ms)

Animations run once (`once: true`) — do not re-animate on scroll-up.

---

## 5. Responsive Navigation (Header.vue)

**Desktop (> 768px):** Horizontal flex nav, links inline

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

## 9. GitHub Pages Deployment

```sh
npm run deploy
```
Uses `gh-pages` package to push `dist/` to the `gh-pages` branch.
`package.json` scripts:
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```
`vite.config.js` `base: '/portfolio-v3/'` ensures all asset paths resolve correctly under the sub-path.

