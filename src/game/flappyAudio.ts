import type { Theme } from '../composables/useTheme'

// Procedural music and sound effects for the mini-game (Web Audio, no audio files).
//
// Dark mode: a slow, warm night track — soft pad chords, drifting electric-piano notes,
// deep bass and faint rain, washed in reverb. Light mode: a brighter summer track — plucky
// arpeggios, a bouncing bass line, soft kick and hats. Switching themes stops the current
// track right away (a quick fade, its own reverb tail included) and starts the other one
// from the top. Nothing is created until the visitor unmutes, and the audio engine is
// suspended while muted or while the tab is hidden, so it costs nothing in the background.

type Mood = 'night' | 'day'

interface Track {
  mood: Mood
  bpm: number
  /** Schedule whatever plays on this 16th-note step */
  play(step: number, time: number): void
  /** Fade out and release everything this track owns */
  stop(at: number): void
}

const STEPS_PER_BAR = 16
const LOOKAHEAD_S = 0.2
const SCHEDULE_EVERY_MS = 25
const SWITCH_FADE_S = 0.3

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

export class GameAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private sfxBus: GainNode | null = null
  /** Reverb input of the track that's playing (each track has its own, so its tail stops with it) */
  private reverbIn: GainNode | null = null
  private sfxReverbIn: GainNode | null = null
  private impulseBuf: AudioBuffer | null = null
  private noise: AudioBuffer | null = null
  private track: Track | null = null

  private mood: Mood
  private muted = true
  private timer: ReturnType<typeof setInterval> | null = null
  private nextStepTime = 0
  private step = 0

  constructor(theme: Theme) {
    this.mood = theme === 'light' ? 'day' : 'night'
    document.addEventListener('visibilitychange', this.onVisibility)
  }

  /** Must be called from a user gesture (the mute button) the first time */
  setMuted(muted: boolean) {
    this.muted = muted
    if (!muted && !this.ctx) this.build()
    const ctx = this.ctx
    if (!ctx || !this.master) return
    const now = ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setTargetAtTime(muted ? 0 : 1, now, 0.08)
    if (muted) {
      setTimeout(() => { if (this.muted) ctx.suspend().catch(() => {}) }, 300)
    } else {
      ctx.resume().catch(() => {})
      // The theme may have changed while muted
      if (this.track && this.track.mood !== this.mood) this.restartTrack()
      this.startScheduler()
    }
  }

  setTheme(theme: Theme) {
    const next: Mood = theme === 'light' ? 'day' : 'night'
    if (next === this.mood) return
    this.mood = next
    // Playing: stop now and start the new theme's track from the top.
    // Muted or not started: the right track starts on the next unmute.
    if (this.timer && this.ctx && !this.muted) this.restartTrack()
  }

  dispose() {
    document.removeEventListener('visibilitychange', this.onVisibility)
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.ctx?.close().catch(() => {})
    this.ctx = null
  }

  // ── Sound effects ──────────────────────────────────────────────────────────

  /** A soft wing whoosh */
  flap() {
    const ctx = this.live()
    if (!ctx) return
    const t = ctx.currentTime
    const src = this.noiseSource(ctx)
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.Q.value = 1.4
    band.frequency.setValueAtTime(700, t)
    band.frequency.exponentialRampToValueAtTime(2200, t + 0.09)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13)
    src.connect(band).connect(g).connect(this.sfxBus!)
    src.start(t, Math.random() * 0.5, 0.15)
  }

  /** A bell chime in the current key that climbs with the score */
  score(points: number) {
    const ctx = this.live()
    if (!ctx) return
    const scale = this.mood === 'night' ? [65, 67, 69, 72, 74, 76, 79] : [67, 69, 71, 74, 76, 79, 81]
    const note = scale[(points - 1) % scale.length]
    const t = ctx.currentTime
    this.bell(ctx, midi(note), t, 0.22, 0.9)
    this.bell(ctx, midi(note + 7), t + 0.07, 0.12, 0.7)
  }

  /** A muffled thud with a gentle falling tone */
  crash() {
    const ctx = this.live()
    if (!ctx) return
    const t = ctx.currentTime
    const thump = ctx.createOscillator()
    thump.type = 'sine'
    thump.frequency.setValueAtTime(150, t)
    thump.frequency.exponentialRampToValueAtTime(48, t + 0.32)
    const tg = ctx.createGain()
    tg.gain.setValueAtTime(0.0001, t)
    tg.gain.exponentialRampToValueAtTime(0.5, t + 0.01)
    tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
    thump.connect(tg).connect(this.sfxBus!)
    thump.start(t)
    thump.stop(t + 0.5)

    const src = this.noiseSource(ctx)
    const low = ctx.createBiquadFilter()
    low.type = 'lowpass'
    low.frequency.value = 600
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.exponentialRampToValueAtTime(0.25, t + 0.01)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
    src.connect(low).connect(ng).connect(this.sfxBus!)
    src.start(t, 0, 0.3)

    // A soft falling minor third, so it reads as "oops" rather than a buzzer
    const base = this.mood === 'night' ? 62 : 67
    this.bell(ctx, midi(base), t + 0.12, 0.1, 0.8)
    this.bell(ctx, midi(base - 3), t + 0.32, 0.09, 1.1)
  }

  /** A short rising flourish for a new best score */
  best() {
    const ctx = this.live()
    if (!ctx) return
    const notes = this.mood === 'night' ? [65, 69, 72, 76] : [67, 71, 74, 79]
    const t = ctx.currentTime + 0.5
    notes.forEach((n, i) => this.bell(ctx, midi(n), t + i * 0.11, 0.16, 1.2))
  }

  // ── Setup ──────────────────────────────────────────────────────────────────

  private live(): AudioContext | null {
    return !this.muted && this.ctx && this.ctx.state === 'running' ? this.ctx : null
  }

  private onVisibility = () => {
    if (!this.ctx) return
    if (document.hidden) this.ctx.suspend().catch(() => {})
    else if (!this.muted) this.ctx.resume().catch(() => {})
  }

  private build() {
    const ctx = new AudioContext()
    this.ctx = ctx

    this.master = ctx.createGain()
    this.master.gain.value = 0
    // Gentle limiter so stacked notes never clip
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.ratio.value = 4
    this.master.connect(comp).connect(ctx.destination)

    // Reverb impulse (decaying stereo noise), shared by every reverb instance
    this.impulseBuf = this.impulse(ctx, 3.2, 2.6)

    this.sfxBus = ctx.createGain()
    this.sfxBus.gain.value = 0.55
    this.sfxBus.connect(this.master)
    this.sfxReverbIn = this.reverbInto(ctx, this.master, 0.55)
    const sfxSend = ctx.createGain()
    sfxSend.gain.value = 0.25
    this.sfxBus.connect(sfxSend).connect(this.sfxReverbIn)

    this.noise = this.noiseBuffer(ctx)
  }

  /** A reverb feeding `out`; returns its input */
  private reverbInto(ctx: AudioContext, out: AudioNode, wetLevel: number): GainNode {
    const input = ctx.createGain()
    const conv = ctx.createConvolver()
    conv.buffer = this.impulseBuf
    const wet = ctx.createGain()
    wet.gain.value = wetLevel
    input.connect(conv).connect(wet).connect(out)
    return input
  }

  private startScheduler() {
    if (this.timer || !this.ctx) return
    if (!this.track) this.track = this.createTrack(this.ctx, this.ctx.currentTime + 0.1)
    this.nextStepTime = this.ctx.currentTime + 0.1
    this.step = 0
    this.timer = setInterval(() => this.schedule(), SCHEDULE_EVERY_MS)
  }

  private schedule() {
    const ctx = this.ctx
    if (!ctx || !this.track || ctx.state !== 'running') return
    while (this.nextStepTime < ctx.currentTime + LOOKAHEAD_S) {
      this.track.play(this.step, this.nextStepTime)
      this.nextStepTime += 60 / this.track.bpm / 4
      this.step++
    }
  }

  /** Stop the current track now and start the current mood's track from bar one */
  private restartTrack() {
    const ctx = this.ctx
    if (!ctx) return
    const now = ctx.currentTime
    this.track?.stop(now)
    const start = now + SWITCH_FADE_S
    this.track = this.createTrack(ctx, start)
    this.nextStepTime = start
    this.step = 0
  }

  private createTrack(ctx: AudioContext, at: number): Track {
    return this.mood === 'night' ? this.nightTrack(ctx, at) : this.dayTrack(ctx, at)
  }

  /**
   * A track's own signal chain: instruments → `bus` → `out` (with a reverb send that also
   * lands in `out`), so fading `out` silences the track and its reverb tail together
   */
  private trackChain(ctx: AudioContext, at: number, volume: number, sendLevel: number) {
    const out = ctx.createGain()
    out.gain.value = 0
    out.gain.setValueAtTime(0, at)
    out.gain.linearRampToValueAtTime(volume, at + 0.15)
    out.connect(this.master!)
    const bus = ctx.createGain()
    bus.connect(out)
    this.reverbIn = this.reverbInto(ctx, out, 0.55)
    const send = ctx.createGain()
    send.gain.value = sendLevel
    bus.connect(send).connect(this.reverbIn)
    const stop = (t: number) => {
      out.gain.cancelScheduledValues(t)
      out.gain.setValueAtTime(out.gain.value, t)
      out.gain.linearRampToValueAtTime(0, t + SWITCH_FADE_S)
      setTimeout(() => out.disconnect(), (SWITCH_FADE_S + 0.2) * 1000)
    }
    return { bus, stop }
  }

  // ── Night: chill, slow, reverb-washed ──────────────────────────────────────

  private nightTrack(ctx: AudioContext, at: number): Track {
    const { bus, stop } = this.trackChain(ctx, at, 0.5, 0.5)
    // Fmaj7 → Em7 → Dm7 → Cmaj7, two bars each
    const chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]
    const bass = [41, 40, 38, 36]

    // Faint rain: filtered noise looping under everything
    const rain = this.noiseSource(ctx, true)
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 400
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400
    const rg = ctx.createGain(); rg.gain.value = 0.045
    rain.connect(hp).connect(lp).connect(rg).connect(bus)
    rain.start(at)

    return {
      mood: 'night',
      bpm: 66,
      stop: (t) => { stop(t); rain.stop(t + SWITCH_FADE_S + 0.1) },
      play: (step, time) => {
        const bar = Math.floor(step / STEPS_PER_BAR)
        const inBar = step % STEPS_PER_BAR
        const chordIdx = Math.floor(bar / 2) % chords.length
        const chord = chords[chordIdx]
        const barLen = (60 / 66) * 4

        if (inBar === 0 && bar % 2 === 0) {
          for (const n of chord) this.pad(ctx, bus, midi(n), time, barLen * 2)
          this.softBass(ctx, bus, midi(bass[chordIdx]), time, barLen * 1.8)
        }
        // Electric-piano notes drift in now and then on the 8ths
        if (inBar % 2 === 0 && Math.random() < 0.28) {
          const n = chord[Math.floor(Math.random() * chord.length)] + 12 + (Math.random() < 0.3 ? 12 : 0)
          this.keys(ctx, bus, midi(n), time + Math.random() * 0.03)
        }
      },
    }
  }

  private pad(ctx: AudioContext, bus: GainNode, freq: number, t: number, dur: number) {
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 900
    lp.Q.value = 0.4
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.05, t + 1.8)
    g.gain.setValueAtTime(0.05, t + dur - 0.5)
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 2.2)
    for (const [type, detune] of [['triangle', -6], ['sine', 7]] as const) {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = freq
      o.detune.value = detune
      o.connect(lp)
      o.start(t)
      o.stop(t + dur + 2.4)
    }
    lp.connect(g)
    g.connect(bus)
    g.connect(this.send(ctx, 0.6))
  }

  private keys(ctx: AudioContext, bus: GainNode, freq: number, t: number) {
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2)
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = freq
    const o2 = ctx.createOscillator()   // a little bell-like overtone for the electric-piano edge
    o2.type = 'sine'
    o2.frequency.value = freq * 3
    const g2 = ctx.createGain()
    g2.gain.setValueAtTime(0.25, t)
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
    o.connect(g)
    o2.connect(g2).connect(g)
    g.connect(bus)
    g.connect(this.send(ctx, 0.8))
    o.start(t); o2.start(t)
    o.stop(t + 2.3); o2.stop(t + 0.5)
  }

  private softBass(ctx: AudioContext, bus: GainNode, freq: number, t: number, dur: number) {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.16, t + 0.4)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(bus)
    o.start(t)
    o.stop(t + dur + 0.1)
  }

  // ── Day: bright, bouncy ─────────────────────────────────────────────────────

  private dayTrack(ctx: AudioContext, at: number): Track {
    // Short plucks carry less energy than night's sustained pads, so this sits higher
    const { bus, stop } = this.trackChain(ctx, at, 0.85, 0.3)
    // G → D/F# → Em → C, one bar each
    const chords = [[55, 59, 62, 67], [54, 57, 62, 66], [52, 55, 59, 64], [52, 55, 60, 64]]
    const bass = [43, 42, 40, 36]
    // Up-and-over arpeggio on the 8ths
    const arp = [0, 1, 2, 3, 2, 1, 2, 3]
    const BPM = 112

    return {
      mood: 'day',
      bpm: BPM,
      stop,
      play: (step, time) => {
        const bar = Math.floor(step / STEPS_PER_BAR)
        const inBar = step % STEPS_PER_BAR
        const chordIdx = bar % chords.length
        const chord = chords[chordIdx]

        if (inBar % 2 === 0) this.pluck(ctx, bus, midi(chord[arp[inBar / 2]] + 12), time)
        if (inBar === 0 || inBar === 6 || inBar === 8 || inBar === 14) {
          this.bounceBass(ctx, bus, midi(bass[chordIdx] + (inBar === 14 ? 7 : 0)), time)
        }
        if (inBar === 0 || inBar === 8) this.kick(ctx, bus, time)
        if (inBar % 4 === 2) this.hat(ctx, bus, time, 0.05)
        else if (inBar % 2 === 1) this.hat(ctx, bus, time, 0.018)
      },
    }
  }

  private pluck(ctx: AudioContext, bus: GainNode, freq: number, t: number) {
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = freq
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(4200, t)
    lp.frequency.exponentialRampToValueAtTime(900, t + 0.25)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38)
    o.connect(lp).connect(g)
    g.connect(bus)
    g.connect(this.send(ctx, 0.25))
    o.start(t)
    o.stop(t + 0.4)
  }

  private bounceBass(ctx: AudioContext, bus: GainNode, freq: number, t: number) {
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = freq
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 700
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32)
    o.connect(lp).connect(g).connect(bus)
    o.start(t)
    o.stop(t + 0.35)
  }

  private kick(ctx: AudioContext, bus: GainNode, t: number) {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(130, t)
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    o.connect(g).connect(bus)
    o.start(t)
    o.stop(t + 0.25)
  }

  private hat(ctx: AudioContext, bus: GainNode, t: number, vol: number) {
    const src = this.noiseSource(ctx)
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 7000
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.003)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
    src.connect(hp).connect(g).connect(bus)
    src.start(t, Math.random() * 0.8, 0.06)
  }

  // ── Building blocks ────────────────────────────────────────────────────────

  private bell(ctx: AudioContext, freq: number, t: number, vol: number, decay: number) {
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    // Fundamental plus a quieter inharmonic partial gives a soft glassy bell
    for (const [mult, level] of [[1, 1], [2.76, 0.18]]) {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = freq * mult
      const pg = ctx.createGain()
      pg.gain.value = level
      o.connect(pg).connect(g)
      o.start(t)
      o.stop(t + decay + 0.05)
    }
    g.connect(this.sfxBus!)
  }

  /** Per-note extra reverb send (on top of the track bus send) */
  private send(ctx: AudioContext, level: number): GainNode {
    const g = ctx.createGain()
    g.gain.value = level * 0.4
    g.connect(this.reverbIn!)
    return g
  }

  private noiseSource(ctx: AudioContext, loop = false): AudioBufferSourceNode {
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    src.loop = loop
    return src
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    const len = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    return buf
  }

  private impulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds)
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch)
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
    return buf
  }
}
