import bgmTrack1 from '@/assets/audio/bgm.m4a'
import bgmTrack2 from '@/assets/audio/bgm-2.m4a'

/**
 * Audio for Sky Crash. Two independent buses feed the master output:
 *
 *   music (bgm playlist) → musicDuck → musicGain ─┐
 *   sfx (synthesized)    ──────────→ sfxGain  ────┴→ master → destination
 *
 * The background tracks play back-to-back and loop. Game sounds momentarily
 * "duck" the music bus so a cash-out chime or a crash is never masked by the
 * soundtrack. Nothing plays until `unlock()` is called from a user gesture,
 * which keeps browsers' autoplay policies happy.
 */

const PLAYLIST = [bgmTrack1, bgmTrack2]

const MUSIC_LEVEL = 0.35
const SFX_LEVEL = 0.8

type AudioContextCtor = typeof AudioContext

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

class SoundEngine {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private musicDuck!: GainNode
  private musicGain!: GainNode
  private sfxGain!: GainNode
  private noise!: AudioBuffer
  private music: HTMLAudioElement | null = null
  private trackIndex = 0

  private musicWanted = false
  private sfxEnabled = true

  private engine: { osc: OscillatorNode; sub: OscillatorNode; filter: BiquadFilterNode; gain: GainNode } | null = null

  get unlocked() {
    return this.ctx !== null
  }

  /** Create/resume the context. Must be called from a user gesture handler. */
  unlock() {
    if (!this.ctx) {
      const Ctor = audioContextCtor()
      if (!Ctor) return
      this.ctx = new Ctor()
      this.buildGraph(this.ctx)
      if (this.musicWanted) this.playMusic()
    }
    if (this.ctx.state === 'suspended' && document.visibilityState === 'visible') {
      void this.ctx.resume()
    }
  }

  /** Pause all output while the tab is hidden; resume when it returns. */
  setPageVisible(visible: boolean) {
    if (!this.ctx) return
    if (visible) {
      void this.ctx.resume()
      if (this.musicWanted) this.playMusic()
    } else {
      void this.ctx.suspend()
      this.music?.pause()
    }
  }

  setMusicEnabled(on: boolean) {
    this.musicWanted = on
    if (!this.ctx) return
    const now = this.ctx.currentTime
    this.musicGain.gain.cancelScheduledValues(now)
    this.musicGain.gain.setTargetAtTime(on ? MUSIC_LEVEL : 0, now, on ? 0.6 : 0.15)
    if (on) this.playMusic()
    else setTimeout(() => !this.musicWanted && this.music?.pause(), 800)
  }

  setSfxEnabled(on: boolean) {
    this.sfxEnabled = on
    if (!on) this.stopEngine()
    if (!this.ctx) return
    this.sfxGain.gain.setTargetAtTime(on ? SFX_LEVEL : 0, this.ctx.currentTime, 0.05)
  }

  // ---------- game sounds ----------

  countdownTick(final = false) {
    const ctx = this.sfxCtx()
    if (!ctx) return
    this.blip(ctx, ctx.currentTime, final ? 1320 : 880, 0.07, 0.12, 'square')
  }

  betPlaced() {
    const ctx = this.sfxCtx()
    if (!ctx) return
    const t = ctx.currentTime
    this.blip(ctx, t, 660, 0.07, 0.16, 'square')
    this.blip(ctx, t + 0.07, 990, 0.09, 0.16, 'square')
    this.duck(0.5, 0.2)
  }

  takeoff() {
    const ctx = this.sfxCtx()
    if (!ctx) return
    const t = ctx.currentTime
    const src = this.noiseSource(ctx)
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 1.4
    bp.frequency.setValueAtTime(300, t)
    bp.frequency.exponentialRampToValueAtTime(2800, t + 1.3)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.35)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5)
    src.connect(bp).connect(g).connect(this.sfxGain)
    src.start(t)
    src.stop(t + 1.6)
    this.duck(0.55, 0.8)
    this.startEngine()
  }

  /** Engine pitch follows the multiplier, like a jet spooling up. */
  updateEngine(multiplier: number) {
    if (!this.ctx || !this.engine) return
    const t = this.ctx.currentTime
    const climb = Math.log(Math.max(1, multiplier))
    const f = 58 + climb * 38
    this.engine.osc.frequency.setTargetAtTime(f, t, 0.12)
    this.engine.sub.frequency.setTargetAtTime(f / 2, t, 0.12)
    this.engine.filter.frequency.setTargetAtTime(380 + climb * 520, t, 0.2)
  }

  cashOut() {
    const ctx = this.sfxCtx()
    if (!ctx) return
    const t = ctx.currentTime
    ;[1047, 1319, 1568, 2093].forEach((f, i) => this.blip(ctx, t + i * 0.065, f, 0.16, 0.14, 'square'))
    this.blip(ctx, t + 0.26, 2637, 0.35, 0.08, 'triangle')
    this.duck(0.3, 0.7)
  }

  crash() {
    const ctx = this.sfxCtx()
    this.stopEngine()
    if (!ctx) return
    const t = ctx.currentTime

    const src = this.noiseSource(ctx)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(2400, t)
    lp.frequency.exponentialRampToValueAtTime(160, t + 1.1)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.7, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3)
    src.connect(lp).connect(g).connect(this.sfxGain)
    src.start(t)
    src.stop(t + 1.4)

    const boom = ctx.createOscillator()
    boom.type = 'sine'
    boom.frequency.setValueAtTime(110, t)
    boom.frequency.exponentialRampToValueAtTime(32, t + 0.8)
    const bg = ctx.createGain()
    bg.gain.setValueAtTime(0.8, t)
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
    boom.connect(bg).connect(this.sfxGain)
    boom.start(t)
    boom.stop(t + 1)

    this.duck(0.2, 1.4)
  }

  stopEngine() {
    if (!this.ctx || !this.engine) return
    const { osc, sub, gain } = this.engine
    const t = this.ctx.currentTime
    gain.gain.cancelScheduledValues(t)
    gain.gain.setTargetAtTime(0, t, 0.08)
    osc.stop(t + 0.5)
    sub.stop(t + 0.5)
    this.engine = null
  }

  // ---------- internals ----------

  private sfxCtx(): AudioContext | null {
    return this.ctx && this.sfxEnabled && this.ctx.state === 'running' ? this.ctx : null
  }

  private buildGraph(ctx: AudioContext) {
    this.master = ctx.createGain()
    this.master.gain.value = 0.9
    this.master.connect(ctx.destination)

    this.musicGain = ctx.createGain()
    this.musicGain.gain.value = 0
    this.musicDuck = ctx.createGain()
    this.musicDuck.connect(this.musicGain).connect(this.master)

    // Background playlist, routed through the music bus so it can be ducked.
    this.music = new Audio(PLAYLIST[this.trackIndex])
    this.music.preload = 'auto'
    this.music.addEventListener('ended', () => {
      this.trackIndex = (this.trackIndex + 1) % PLAYLIST.length
      if (!this.music) return
      this.music.src = PLAYLIST[this.trackIndex]!
      if (this.musicWanted) this.playMusic()
    })
    ctx.createMediaElementSource(this.music).connect(this.musicDuck)

    this.sfxGain = ctx.createGain()
    this.sfxGain.gain.value = this.sfxEnabled ? SFX_LEVEL : 0
    this.sfxGain.connect(this.master)

    const length = ctx.sampleRate * 2
    this.noise = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = this.noise.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1

    if (this.musicWanted) {
      this.musicGain.gain.setTargetAtTime(MUSIC_LEVEL, ctx.currentTime, 0.8)
    }
  }

  private playMusic() {
    if (!this.music || document.visibilityState !== 'visible') return
    // play() can reject if the browser still considers audio locked; toggling music retries.
    this.music.play().catch(() => undefined)
  }

  private blip(ctx: AudioContext, t: number, freq: number, dur: number, level: number, type: OscillatorType) {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(level, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g).connect(this.sfxGain)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  private noiseSource(ctx: AudioContext) {
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    return src
  }

  private startEngine() {
    const ctx = this.sfxCtx()
    if (!ctx || this.engine) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = 58
    const sub = ctx.createOscillator()
    sub.type = 'triangle'
    sub.frequency.value = 29
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 380
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.07, t + 0.6)
    osc.connect(filter)
    sub.connect(filter)
    filter.connect(gain).connect(this.sfxGain)
    osc.start(t)
    sub.start(t)
    this.engine = { osc, sub, filter, gain }
  }

  /** Dip the music to `level` (0–1) for `hold` seconds, then recover. */
  private duck(level: number, hold: number) {
    if (!this.ctx) return
    const g = this.musicDuck.gain
    const t = this.ctx.currentTime
    g.cancelScheduledValues(t)
    g.setTargetAtTime(level, t, 0.03)
    g.setTargetAtTime(1, t + hold, 0.35)
  }
}

export const soundEngine = new SoundEngine()
