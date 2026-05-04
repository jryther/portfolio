<template>
  <section
    id="home"
    ref="heroSection"
    class="hero"
  >
    <!-- Canvas layers -->
    <canvas
      ref="cloudCanvas"
      class="canvas-layer"
      style="z-index:0"
      aria-hidden="true"
    />
    <canvas
      ref="rainCanvas"
      class="canvas-layer"
      style="z-index:1"
      aria-hidden="true"
    />
    <canvas
      ref="lightningCanvas"
      class="canvas-layer"
      style="z-index:2; pointer-events:all; cursor:default"
      aria-hidden="true"
      @click="onHeroClick"
    />

    <!-- Hero text -->
    <div
      class="hero-text"
      style="position:relative; z-index:3"
    >
      <p
        class="text-body mb-[0.6rem]"
        data-aos="fade-in-up"
      >
        Hey there 👋, I'm
      </p>
      <h1
        class="font-bold leading-[1.05] mb-4"
        data-aos="fade-in-up"
        data-aos-delay="200"
      >
        Josh Ryther
      </h1>
      <h3
        class="text-amber font-medium my-4 mb-8"
        data-aos="fade-in-up"
        data-aos-delay="400"
      >
        Full-Stack Software Engineer | React • Vue • Node.js • TypeScript
      </h3>
      <p
        class="text-ash mb-[1.2rem] small-resume"
        data-aos="fade-in-up"
        data-aos-delay="600"
      >
        Building robust, high-quality web applications with a foundation in precision and zero-error-tolerance workflows. Specialized in modernizing legacy systems, architecting scalable solutions, and delivering accessible, user-centric software.
      </p>
      <a
        href="#contact"
        class="button"
        data-aos="fade-in-up"
        data-aos-delay="800"
      >Let's Connect</a>

      <div
        class="flex items-center gap-[1.4rem] pt-[0.6rem] flex-wrap social-media"
        data-aos="fade-in-up"
        data-aos-delay="1000"
      >
        <a
          href="https://linkedin.com/in/joshua-ryther-121400109"
          target="_blank"
          rel="noreferrer"
          title="LinkedIn"
          class="inline-flex items-center gap-2 font-medium text-mist transition-[color,transform] duration-300 hover:text-amber hover:-translate-y-[2px]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 640"
            class="social-svg fill-amber transition-[fill] duration-300 group-hover:fill-golden"
          ><!--!Font Awesome Free v7.2.0 by @fontawesome--><path d="M160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 160C544 124.7 515.3 96 480 96L160 96zM165 266.2L231.5 266.2L231.5 480L165 480L165 266.2zM236.7 198.5C236.7 219.8 219.5 237 198.2 237C176.9 237 159.7 219.8 159.7 198.5C159.7 177.2 176.9 160 198.2 160C219.5 160 236.7 177.2 236.7 198.5zM413.9 480L413.9 376C413.9 351.2 413.4 319.3 379.4 319.3C344.8 319.3 339.5 346.3 339.5 374.2L339.5 480L273.1 480L273.1 266.2L336.8 266.2L336.8 295.4L337.7 295.4C346.6 278.6 368.3 260.9 400.6 260.9C467.8 260.9 480.3 305.2 480.3 362.8L480.3 480L413.9 480z" /></svg>LinkedIn
        </a>
        <a
          href="https://github.com/jryther"
          target="_blank"
          rel="noreferrer"
          title="GitHub"
          class="inline-flex items-center gap-2 font-medium text-mist transition-[color,transform] duration-300 hover:text-amber hover:-translate-y-[2px]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 640"
            class="social-svg fill-amber transition-[fill] duration-300"
          ><!--!Font Awesome Free v7.2.0--><path d="M544 160C544 124.7 515.3 96 480 96L160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 160zM361.8 471.7C361.8 469.9 361.8 465.7 361.9 460.1C362 448.7 362 431.3 362 416.4C362 400.8 356.8 390.9 350.7 385.7C387.7 381.6 426.7 376.5 426.7 312.6C426.7 294.4 420.2 285.3 409.6 273.6C411.3 269.3 417 251.6 407.9 228.6C394 224.3 362.2 246.5 362.2 246.5C335.6 239 305.6 239 279 246.5C279 246.5 247.2 224.3 233.3 228.6C224.2 251.5 229.8 269.2 231.6 273.6C221 285.3 216 294.4 216 312.6C216 376.2 253.3 381.6 290.3 385.7C285.5 390 281.2 397.4 279.7 408C270.2 412.3 245.9 419.7 231.4 394.1C222.3 378.3 205.9 377 205.9 377C189.7 376.8 204.8 387.2 204.8 387.2C215.6 392.2 223.2 411.4 223.2 411.4C232.9 441.1 279.3 431.1 279.3 431.1C279.3 440.1 279.4 452.8 279.4 461.7C279.4 466.5 279.5 470.3 279.5 471.7C279.5 476 276.5 481.2 268 479.7C202 457.6 155.8 394.8 155.8 321.4C155.8 229.6 226 159.9 317.8 159.9C409.6 159.9 484 229.6 484 321.4C484.1 394.8 439.3 457.7 373.3 479.7C364.9 481.2 361.8 476 361.8 471.7z" /></svg> GitHub
        </a>
        <a
          href="mailto:jryther91@gmail.com"
          title="Email"
          class="inline-flex items-center gap-2 font-medium text-mist transition-[color,transform] duration-300 hover:text-amber hover:-translate-y-[2px]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 640"
            class="social-svg fill-amber transition-[fill] duration-300"
          ><!--!Font Awesome Free v7.2.0--><path d="M112 128C85.5 128 64 149.5 64 176C64 191.1 71.1 205.3 83.2 214.4L291.2 370.4C308.3 383.2 331.7 383.2 348.8 370.4L556.8 214.4C568.9 205.3 576 191.1 576 176C576 149.5 554.5 128 528 128L112 128zM64 260L64 448C64 483.3 92.7 512 128 512L512 512C547.3 512 576 483.3 576 448L576 260L377.6 408.8C343.5 434.4 296.5 434.4 262.4 408.8L64 260z" /></svg> Email
        </a>
      </div>
    </div>

    <!-- Mount Hood image -->
    <div
      class="hero-image"
      style="position:relative; z-index:3"
      aria-hidden="true"
    >
      <img
        :src="MountHoodImage"
        alt="Mount Hood"
        class="mount-hood"
        draggable="false"
      >
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import MountHoodImage from "../assets/MountHoodImage.webp"
import BigfootSrc from "../assets/bigfoot.png"

interface Point          { x: number; y: number }
interface Flash          { life: number; maxLife: number; bfX: number; bfY: number; showBigfoot: boolean; boltPoints: Point[] }
interface Cloud          { x: number; y: number; speed: number; scale: number; opacity: number }
interface Drop           { x: number; y: number; length: number; speed: number; opacity: number; width: number }
interface Splash         { x: number; y: number; opacity: number; radius: number; maxRadius: number; life: number; decay: number }
interface AnimController { cleanup: () => void; pause: () => void; resume: () => void }
interface LightningController { trigger: (x: number, y: number) => void; cleanup: () => void }

const rainCanvas      = ref<HTMLCanvasElement | null>(null)
const cloudCanvas     = ref<HTMLCanvasElement | null>(null)
const lightningCanvas = ref<HTMLCanvasElement | null>(null)
const heroSection     = ref<HTMLElement | null>(null)
let animationId:      number | null = null
let cloudAnimationId: number | null = null

// ── Bigfoot — fixed absolute position on the canvas ──────────────────────────
const BIGFOOT_POS       = { xFrac: 0.78, yFrac: 0.82 }
const BIGFOOT_PROXIMITY = 280 // px radius — only show Bigfoot if click is this close

// Pre-load the bigfoot image once
const bigfootImg = new Image()
bigfootImg.src   = BigfootSrc

// Offscreen canvas for the silhouette — built once after image loads
let bigfootSilhouette: HTMLCanvasElement | null = null

function buildSilhouette() {
  if (!bigfootImg.complete || !bigfootImg.naturalWidth) return

  const src    = document.createElement('canvas')
  src.width    = bigfootImg.naturalWidth
  src.height   = bigfootImg.naturalHeight
  const sCtx   = src.getContext('2d')
  if (!sCtx) return
  sCtx.drawImage(bigfootImg, 0, 0)

  const imageData = sCtx.getImageData(0, 0, src.width, src.height)
  const data      = imageData.data

  // For each pixel: if it's light (background) make it transparent,
  // if it's dark (the figure) make it the silhouette colour
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2]
    const brightness = (r + g + b) / 3
    if (brightness > 180) {
      // Light pixel — background, make transparent
      data[i+3] = 0
    } else {
      // Dark pixel — part of the figure, paint silhouette colour
      // Muted blue-grey — visible against dark background without being too intense
      data[i]   = 160
      data[i+1] = 175
      data[i+2] = 200
      data[i+3] = 255
    }
  }

  sCtx.putImageData(imageData, 0, 0)
  bigfootSilhouette = src
}

bigfootImg.onload = buildSilhouette

function drawBigfoot(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  if (!bigfootSilhouette) return

  const targetH = 220
  const aspect  = bigfootSilhouette.width / bigfootSilhouette.height
  const targetW = targetH * aspect
  ctx.drawImage(bigfootSilhouette, cx - targetW / 2, cy - targetH, targetW, targetH)
}

// ── Lightning ─────────────────────────────────────────────────────────────────


function initLightning(canvas: HTMLCanvasElement): LightningController {
  const ctx     = canvas.getContext('2d')!
  const section = canvas.parentElement as HTMLElement

  function resize() {
    canvas.width  = section.offsetWidth
    canvas.height = section.offsetHeight
  }
  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(section)

  const flashes: Flash[] = []

  function makeBolt(fromX: number, toX: number, toY: number): Point[] {
    const points: Point[] = [{ x: fromX, y: 0 }]
    let cy = 0
    while (cy < toY) {
      cy = Math.min(cy + Math.random() * 55 + 25, toY)
      points.push({ x: fromX + (Math.random() - 0.5) * 70, y: cy })
    }
    points[points.length - 1] = { x: toX, y: toY }
    return points
  }

  function triggerFlash(clickX: number, clickY: number) {

    // Bigfoot's canvas-space position
    const bfX  = canvas.width  * BIGFOOT_POS.xFrac
    const bfY  = canvas.height * BIGFOOT_POS.yFrac
    const dist = Math.hypot(clickX - bfX, clickY - bfY)

    // Lightning always strikes the click point
    // Bigfoot only appears if click is close enough
    const showBigfoot = dist <= BIGFOOT_PROXIMITY

    const originX    = clickX + (Math.random() - 0.5) * 60
    const boltPoints = makeBolt(originX, clickX, clickY)

    flashes.push({ life: 70, maxLife: 70, bfX, bfY, showBigfoot, boltPoints })
  }

  function drawBolt(points: Point[], alpha: number) {
    if (points.length < 2) return
    ctx.save()
    ctx.strokeStyle = `rgba(180,210,255,${alpha * 0.18})`
    ctx.lineWidth   = 6
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
    ctx.stroke()
    ctx.strokeStyle = `rgba(210,230,255,${alpha * 0.35})`
    ctx.lineWidth   = 1.5
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
    ctx.stroke()
    ctx.restore()
  }

  function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    flashes.forEach(f => {
      const t = f.life / f.maxLife

      const boltAlpha = t > 0.5 ? (t - 0.5) / 0.5 : t / 0.5
      drawBolt(f.boltPoints, boltAlpha)

      // Only draw Bigfoot silhouette if the click was close enough
      if (f.showBigfoot) {
        ctx.save()
        ctx.globalAlpha = Math.min(t * 2.5, 0.85)
        drawBigfoot(ctx, f.bfX, f.bfY)
        ctx.restore()
      }

      f.life--
    })
    for (let i = flashes.length - 1; i >= 0; i--) {
      if (flashes[i].life <= 0) flashes.splice(i, 1)
    }
    requestAnimationFrame(drawFrame)
  }

  drawFrame()
  return { trigger: triggerFlash, cleanup: () => resizeObserver.disconnect() }
}

let lightningController: LightningController | null = null

// ── Clouds ────────────────────────────────────────────────────────────────────

function makeCloud(canvasWidth: number): Cloud {
  return {
    x:       Math.random() * canvasWidth,
    y:       Math.random() * 30 + 130,
    speed:   Math.random() * 0.15 + 0.05,
    scale:   Math.random() * 0.5 + 0.8,
    opacity: Math.random() * 0.09 + 0.08,
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number, opacity: number) {
  ctx.save()
  const w = 260 * scale
  const h = 90  * scale
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.50, cy + h * 0.10)
  ctx.bezierCurveTo(cx - w * 0.55, cy + h * 0.40, cx - w * 0.20, cy + h * 0.55, cx, cy + h * 0.50)
  ctx.bezierCurveTo(cx + w * 0.20, cy + h * 0.55, cx + w * 0.55, cy + h * 0.40, cx + w * 0.50, cy + h * 0.10)
  ctx.bezierCurveTo(cx + w * 0.55, cy - h * 0.05, cx + w * 0.46, cy - h * 0.05, cx + w * 0.38, cy - h * 0.05)
  ctx.bezierCurveTo(cx + w * 0.46, cy - h * 0.70, cx + w * 0.22, cy - h * 0.90, cx + w * 0.10, cy - h * 0.60)
  ctx.bezierCurveTo(cx + w * 0.20, cy - h * 1.15, cx - w * 0.05, cy - h * 1.20, cx - w * 0.10, cy - h * 0.75)
  ctx.bezierCurveTo(cx - w * 0.08, cy - h * 1.05, cx - w * 0.30, cy - h * 1.00, cx - w * 0.28, cy - h * 0.65)
  ctx.bezierCurveTo(cx - w * 0.28, cy - h * 0.85, cx - w * 0.50, cy - h * 0.75, cx - w * 0.50, cy + h * 0.10)
  ctx.closePath()
  ctx.clip()

  const base = ctx.createLinearGradient(cx, cy - h, cx, cy + h * 0.55)
  base.addColorStop(0,   `rgba(100,120,160,${opacity * 1.4})`)
  base.addColorStop(0.5, `rgba(130,150,185,${opacity * 1.1})`)
  base.addColorStop(1,   `rgba(80,100,140,${opacity * 0.9})`)
  ctx.fillStyle = base
  ctx.fillRect(cx - w, cy - h * 1.3, w * 2, h * 2)

  const hl1 = ctx.createRadialGradient(cx - w*0.05, cy - h*0.55, 0, cx - w*0.05, cy - h*0.55, w*0.38)
  hl1.addColorStop(0,   `rgba(200,215,240,${opacity * 1.2})`)
  hl1.addColorStop(0.5, `rgba(160,180,210,${opacity * 0.5})`)
  hl1.addColorStop(1,   `rgba(100,120,160,0)`)
  ctx.fillStyle = hl1
  ctx.fillRect(cx - w, cy - h * 1.3, w * 2, h * 2)

  const hl2 = ctx.createRadialGradient(cx + w*0.22, cy - h*0.38, 0, cx + w*0.22, cy - h*0.38, w*0.24)
  hl2.addColorStop(0, `rgba(190,210,235,${opacity * 0.9})`)
  hl2.addColorStop(1, `rgba(100,120,160,0)`)
  ctx.fillStyle = hl2
  ctx.fillRect(cx - w, cy - h * 1.3, w * 2, h * 2)

  const belly = ctx.createRadialGradient(cx, cy + h*0.3, 0, cx, cy + h*0.3, w*0.55)
  belly.addColorStop(0,   `rgba(40,55,90,${opacity * 1.2})`)
  belly.addColorStop(0.6, `rgba(50,65,100,${opacity * 0.6})`)
  belly.addColorStop(1,   `rgba(50,65,100,0)`)
  ctx.fillStyle = belly
  ctx.fillRect(cx - w, cy, w * 2, h * 0.65)
  ctx.restore()
}

function initClouds(canvas: HTMLCanvasElement): AnimController {
  const ctx     = canvas.getContext('2d')!
  const section = canvas.parentElement as HTMLElement
  function resize() {
    canvas.width  = section.offsetWidth
    canvas.height = section.offsetHeight
  }
  resize()

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(section)

  const clouds: Cloud[] = []
  for (let i = 0; i < 4; i++) {
    const c = makeCloud(canvas.width)
    c.x = (canvas.width / 4) * i + Math.random() * 100
    clouds.push(c)
  }

  function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    clouds.forEach(cloud => {
      drawCloud(ctx, cloud.x, cloud.y, cloud.scale, cloud.opacity)
      cloud.x += cloud.speed
      if (cloud.x > canvas.width + 300) {
        cloud.x = -300
        cloud.y = Math.random() * 30 + 130
      }
    })
    cloudAnimationId = requestAnimationFrame(drawFrame)
  }
  drawFrame()

  function pause()  { if (cloudAnimationId !== null) cancelAnimationFrame(cloudAnimationId); cloudAnimationId = null }
  function resume() { if (!cloudAnimationId) drawFrame() }

  return { cleanup: () => { resizeObserver.disconnect(); if (cloudAnimationId !== null) cancelAnimationFrame(cloudAnimationId) }, pause, resume }
}

// ── Rain ──────────────────────────────────────────────────────────────────────

function initRain(canvas: HTMLCanvasElement): AnimController {
  const ctx     = canvas.getContext('2d')!
  const section = canvas.parentElement as HTMLElement
  function resize() {
    canvas.width  = section.offsetWidth
    canvas.height = section.offsetHeight
  }
  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(section)

  const ANGLE = Math.PI / 10
  const dx    = Math.sin(ANGLE)
  const dy    = Math.cos(ANGLE)

  const drops: Drop[] = []
  function makeDropAt(x: number, y: number): Drop {
    return { x, y, length: Math.random() * 14 + 8, speed: Math.random() * 2 + 1.2, opacity: Math.random() * 0.18 + 0.08, width: Math.random() * 0.6 + 0.3 }
  }
  for (let i = 0; i < 90; i++) drops.push(makeDropAt(Math.random() * canvas.width, Math.random() * canvas.height))

  const splashes: Splash[] = []
  function spawnSplash(x: number, y: number, op: number) {
    splashes.push({ x, y, opacity: Math.min(op * 2.5, 0.7), radius: 1, maxRadius: Math.random() * 10 + 10, life: 1, decay: Math.random() * 0.018 + 0.012 })
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drops.forEach(drop => {
      ctx.beginPath()
      ctx.moveTo(drop.x, drop.y)
      ctx.lineTo(drop.x + dx * drop.length, drop.y + dy * drop.length)
      ctx.strokeStyle = `rgba(180,210,255,${drop.opacity})`
      ctx.lineWidth = drop.width
      ctx.lineCap  = 'round'
      ctx.stroke()
      drop.x += dx * drop.speed
      drop.y += dy * drop.speed
      if (drop.y > canvas.height - 20) { spawnSplash(drop.x, canvas.height - 20, drop.opacity); Object.assign(drop, makeDropAt(Math.random() * canvas.width, -drop.length)) }
      if (drop.x > canvas.width + drop.length) { drop.x = -drop.length; drop.y = Math.random() * canvas.height }
    })
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i]; const alpha = s.opacity * s.life
      ctx.beginPath(); ctx.ellipse(s.x, s.y, s.radius * 2.2, s.radius * 0.6, 0, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(180,210,255,${alpha})`; ctx.lineWidth = 1.2; ctx.stroke()
      const tl = s.radius * 1.2
      ;[-Math.PI / 5, Math.PI + Math.PI / 5].forEach(a => {
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + Math.cos(a) * tl, s.y + Math.sin(a) * tl * 0.75)
        ctx.strokeStyle = `rgba(180,210,255,${alpha * 0.75})`; ctx.lineWidth = 0.8; ctx.lineCap = 'round'; ctx.stroke()
      })
      s.radius = Math.min(s.radius + 0.35, s.maxRadius); s.life -= s.decay
      if (s.life <= 0) splashes.splice(i, 1)
    }
    animationId = requestAnimationFrame(draw)
  }
  draw()

  function pause()  { if (animationId !== null) cancelAnimationFrame(animationId); animationId = null }
  function resume() { if (!animationId) draw() }

  return { cleanup: () => { resizeObserver.disconnect(); if (animationId !== null) cancelAnimationFrame(animationId) }, pause, resume }
}

// ── Handlers & lifecycle ──────────────────────────────────────────────────────

function onHeroClick(e: MouseEvent) {
  if (!lightningController || !lightningCanvas.value) return
  const rect = lightningCanvas.value.getBoundingClientRect()
  lightningController.trigger(e.clientX - rect.left, e.clientY - rect.top)
}

let rainController: AnimController | null = null, cloudController: AnimController | null = null

onMounted(() => {
  rainController      = initRain(rainCanvas.value!)
  cloudController     = initClouds(cloudCanvas.value!)
  lightningController = initLightning(lightningCanvas.value!)
})

onUnmounted(() => {
  if (rainController)      rainController.cleanup()
  if (cloudController)     cloudController.cleanup()
  if (lightningController) lightningController.cleanup()
})
</script>

<style scoped>
.hero {
  padding: 4vh 3% 4vh 3%;
  height: 100vh;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 2rem;
  background: transparent;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}

.canvas-layer {
  position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;
}

.hero-text {
  flex: 0 0 34%; max-width: 680px;
  display: flex; flex-direction: column; justify-content: center;
  gap: 0.6rem; align-items: flex-start;
}
.hero-text > p   { font-size: clamp(1rem, 2.2vw, 1.6rem); }
.hero-text h1    { font-size: clamp(3rem, 6.5vw, 5.5rem); }
.hero-text h3    { font-size: clamp(1.2rem, 2.4vw, 1.9rem); }
.small-resume    { font-size: clamp(0.95rem, 1.8vw, 1.4rem); }
.social-media a  { font-size: clamp(1.1rem, 1.8vw, 1.4rem); }
.social-svg      { width: 1.6em; height: 1.6em; flex-shrink: 0; vertical-align: middle; }

.hero-image {
  flex: 1 1 66%; display: flex;
  justify-content: center; align-items: center; pointer-events: none;
}
.mount-hood {
  width: 75%; max-width: 1600px; max-height: 64vh;
  height: auto; object-fit: contain; display: block;
}

@media (max-width: 1200px) {
  .hero-text { flex: 0 0 44%; }
  .mount-hood { width: 85%; max-height: 54vh; }
}
@media (max-width: 960px) {
  .hero { padding: 6vh 4%; flex-direction: column; }
  .hero-text { flex: 1 1 auto; max-width: none; }
  .hero-image { width: 100%; margin-top: 2rem; }
  .mount-hood { width: 100%; max-width: 1200px; max-height: 46vh; }
  .hero-text h1 { font-size: clamp(2.6rem, 8vw, 4.2rem); }
  .hero-text h3 { font-size: clamp(1rem, 3.5vw, 1.4rem); }
}
@media (max-width: 600px) {
  .hero { padding: 35% 2rem 5%; }
  .hero-text h1 { font-size: 3rem; }
  .hero-text h3 { font-size: 1.2rem; }
  .mount-hood   { width: 100%; max-width: 600px; }
}
@media (max-width: 480px) {
  .hero { padding: 45% 1.5rem 5%; }
  .hero-text h1 { font-size: 2.5rem; }
}
</style>
