import bgmTrack1 from '@/assets/audio/bgm.m4a'
import bgmTrack2 from '@/assets/audio/bgm-2.m4a'

/**
 * Audio for Sky Crash. Three independent buses feed the master output:
 *
 *   music (bgm playlist)      → musicDuck → musicGain ─┐
 *   plane (engine drone)      → planeDuck → planeGain ─┼→ master → destination
 *   game (take-off, win, ...) → cue gain  → gameGain  ─┘
 *
 * The background tracks play back-to-back and loop. Game sounds momentarily
 * "duck" the music (and the engine) so a cash-out chime or a crash is never
 * masked. The big one-shot cues (take-off, win, crash) each get their own gain
 * node, and starting one fades out the previous one, so they never pile up.
 * Nothing plays until `unlock()` is called from a user gesture, which keeps
 * browsers' autoplay policies happy.
 *
 * Each bus has a player-set volume (0–1) layered on top of its base level, so
 * the effective output is master × channel and changes apply live.
 */

const PLAYLIST = [bgmTrack1, bgmTrack2]

const MASTER_LEVEL = 0.9
const MUSIC_LEVEL = 0.35
/** Quietest level the music bus goes to while playing (inaudible, but not silent). */
const SILENT_FLOOR = 0.001
const PLANE_LEVEL = 0.8
const GAME_LEVEL = 0.8

export type AudioChannel = 'master' | 'music' | 'plane' | 'game'

type AudioContextCtor = typeof AudioContext

function isIOS(): boolean {
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/** A 0.5 s silent 8 kHz mono WAV, as a data URI (no network request). */
function silentWav(): string {
  const samples = 4000
  const bytes = new Uint8Array(44 + samples)
  const view = new DataView(bytes.buffer)
  const write = (o: number, t: string) => [...t].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)))
  write(0, 'RIFF'); view.setUint32(4, 36 + samples, true); write(8, 'WAVE')
  write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, 8000, true); view.setUint32(28, 8000, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true)
  write(36, 'data'); view.setUint32(40, samples, true)
  bytes.fill(128, 44)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return `data:audio/wav;base64,${btoa(binary)}`
}

let keepAlive: HTMLAudioElement | null = null
function startSilentKeepAlive() {
  if (!keepAlive) {
    keepAlive = new Audio(silentWav())
    keepAlive.loop = true
    keepAlive.setAttribute('playsinline', '')
    keepAlive.setAttribute('x-webkit-airplay', 'deny')
  }
  if (keepAlive.paused) keepAlive.play().catch(() => undefined)
}

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
  private planeDuck!: GainNode
  private planeGain!: GainNode
  private gameGain!: GainNode
  /** Gain node of the take-off / win / crash cue currently sounding, if any. */
  private cue: GainNode | null = null
  private noise!: AudioBuffer
  private music: HTMLAudioElement | null = null
  private trackIndex = 0

  private musicWanted = false
  /** A round is in the air (so the engine should hum if plane sounds are on). */
  private flying = false
  private planeEnabled = true
  private gameEnabled = true
  private masterEnabled = true
  private volume: Record<AudioChannel, number> = { master: 1, music: 1, plane: 1, game: 1 }

  private engine: { osc: OscillatorNode; sub: OscillatorNode; filter: BiquadFilterNode; gain: GainNode } | null = null

  /**
   * True once audio is really running (and the soundtrack, if wanted, is actually playing).
   * Mobile browsers often ignore the first attempt, so callers keep calling unlock() on
   * every user gesture until this is true.
   */
  get unlocked() {
    if (!this.ctx || this.ctx.state !== 'running') return false
    return !this.musicWanted || !this.music || !this.music.paused
  }

  /** Create/resume the context. Must be called from a user gesture handler. */
  unlock() {
    // iPhones: play through the ringer/silent switch like a music app, instead of being
    // muted in silent mode (Safari 16.4+; ignored elsewhere).
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session && session.type !== 'playback') {
      try {
        session.type = 'playback'
      } catch {
        // Not supported: carry on with the default session.
      }
    }
    // Older iPhones (no audioSession API): a silent, looping HTML audio clip switches the page
    // into media playback, so Web Audio (and the soundtrack routed through it) isn't muted by
    // the silent switch. Started from this gesture; retried on later gestures if refused.
    if (!session && isIOS()) startSilentKeepAlive()
    if (!this.ctx) {
      const Ctor = audioContextCtor()
      if (!Ctor) return
      this.ctx = new Ctor()
      this.buildGraph(this.ctx)
      // iOS "interrupts" audio for calls, Siri or the lock screen; pick back up afterwards.
      this.ctx.addEventListener('statechange', () => {
        if (this.ctx?.state !== 'running' && document.visibilityState === 'visible') void this.ctx?.resume()
      })
      this.startWatchdog()
    }
    if (this.ctx.state !== 'running' && document.visibilityState === 'visible') {
      void this.ctx.resume()
    }
    // Retried on every gesture until it sticks: the first play() is often refused on phones.
    if (this.musicWanted) this.playMusic()
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
    this.musicGain.gain.setTargetAtTime(this.musicLevel(), now, on ? 0.6 : 0.15)
    if (on) this.playMusic()
    else setTimeout(() => !this.musicWanted && this.music?.pause(), 800)
  }

  /** Plane sounds: the engine / flight hum. */
  setPlaneEnabled(on: boolean) {
    const wasOn = this.planeEnabled
    this.planeEnabled = on
    if (!on) this.stopEngine()
    if (!this.ctx) return
    this.planeGain.gain.setTargetAtTime(this.planeLevel(), this.ctx.currentTime, 0.05)
    // Unmuting mid-flight brings the drone straight back.
    if (on && !wasOn && this.flying) this.startEngine()
  }

  /** Game sounds: countdown, bet, take-off cue, checkpoints, win chime, crash. */
  setGameEnabled(on: boolean) {
    this.gameEnabled = on
    if (!this.ctx) return
    this.gameGain.gain.setTargetAtTime(this.gameLevel(), this.ctx.currentTime, 0.05)
  }

  setMasterEnabled(on: boolean) {
    this.masterEnabled = on
    if (!this.ctx) return
    this.master.gain.setTargetAtTime(this.masterLevel(), this.ctx.currentTime, 0.05)
  }

  /** Player volumes, each 0–1. Applied live on top of the bus base levels. */
  setVolumes(v: Record<AudioChannel, number>) {
    const clamp = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1)
    this.volume = { master: clamp(v.master), music: clamp(v.music), plane: clamp(v.plane), game: clamp(v.game) }
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.master.gain.setTargetAtTime(this.masterLevel(), t, 0.05)
    this.musicGain.gain.setTargetAtTime(this.musicLevel(), t, 0.05)
    this.planeGain.gain.setTargetAtTime(this.planeLevel(), t, 0.05)
    this.gameGain.gain.setTargetAtTime(this.gameLevel(), t, 0.05)
  }

  // ---------- game sounds ----------

  countdownTick(final = false) {
    const ctx = this.gameCtx()
    if (!ctx) return
    this.blip(ctx, ctx.currentTime, final ? 1320 : 880, 0.07, 0.12, 'square')
  }

  betPlaced() {
    const ctx = this.gameCtx()
    if (!ctx) return
    const t = ctx.currentTime
    this.blip(ctx, t, 660, 0.07, 0.16, 'square')
    this.blip(ctx, t + 0.07, 990, 0.09, 0.16, 'square')
    this.duck(0.5, 0.2)
  }

  /** Flying through a checkpoint ring: a quick rising arpeggio, pitched up for higher tiers. */
  checkpoint(tier = 0) {
    const ctx = this.gameCtx()
    if (!ctx) return
    const t = ctx.currentTime
    const base = 660 * Math.pow(2, Math.min(tier, 4) / 6)
    ;[1, 1.25, 1.5, 2].forEach((ratio, i) => this.blip(ctx, t + i * 0.05, base * ratio, 0.08, 0.12, 'triangle'))
  }

  takeoff() {
    this.flying = true
    this.startEngine()
    const ctx = this.gameCtx()
    if (!ctx) return
    const t = ctx.currentTime
    const out = this.claimCue(ctx)
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
    src.connect(bp).connect(g).connect(out)
    src.start(t)
    src.stop(t + 1.6)
    this.duck(0.55, 0.8)
  }

  /** Engine drone only, for joining a round already in flight (no take-off whoosh). */
  engineOn() {
    this.flying = true
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

  /** The win chime: the current player banked credits before the crash. */
  cashOut() {
    const ctx = this.gameCtx()
    if (!ctx) return
    const t = ctx.currentTime
    const out = this.claimCue(ctx)
    ;[1047, 1319, 1568, 2093].forEach((f, i) => this.blip(ctx, t + i * 0.065, f, 0.16, 0.14, 'square', out))
    this.blip(ctx, t + 0.26, 2637, 0.35, 0.08, 'triangle', out)
    this.duck(0.3, 0.7)
    // The plane keeps flying for everyone else; dip its hum so the chime is clear.
    this.duckPlane(0.35, 0.9)
  }

  /** The round ended: stop the engine, boom, and pull the music right down. */
  crash() {
    this.flying = false
    this.stopEngine()
    const ctx = this.gameCtx()
    if (!ctx) return
    const t = ctx.currentTime
    const out = this.claimCue(ctx)

    const src = this.noiseSource(ctx)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(2400, t)
    lp.frequency.exponentialRampToValueAtTime(160, t + 1.1)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.7, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3)
    src.connect(lp).connect(g).connect(out)
    src.start(t)
    src.stop(t + 1.4)

    const boom = ctx.createOscillator()
    boom.type = 'sine'
    boom.frequency.setValueAtTime(110, t)
    boom.frequency.exponentialRampToValueAtTime(32, t + 0.8)
    const bg = ctx.createGain()
    bg.gain.setValueAtTime(0.8, t)
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
    boom.connect(bg).connect(out)
    boom.start(t)
    boom.stop(t + 1)

    this.duck(0.2, 1.4)
  }

  /** The round is over without a watched crash (snapshot, leaving the screen): just silence the drone. */
  landed() {
    this.flying = false
    this.stopEngine()
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

  private gameCtx(): AudioContext | null {
    return this.ctx && this.gameEnabled && this.ctx.state === 'running' ? this.ctx : null
  }

  private planeCtx(): AudioContext | null {
    return this.ctx && this.planeEnabled && this.ctx.state === 'running' ? this.ctx : null
  }

  private masterLevel() {
    return this.masterEnabled ? MASTER_LEVEL * this.volume.master : 0
  }

  // Browsers pause a media element whose output is completely silent, so while music is
  // wanted its level never drops below an inaudible floor (a fade-in from 0 used to make the
  // soundtrack stop a fraction of a second after starting on some devices).
  private musicLevel() {
    return this.musicWanted ? Math.max(SILENT_FLOOR, MUSIC_LEVEL * this.volume.music) : 0
  }

  private planeLevel() {
    return this.planeEnabled ? PLANE_LEVEL * this.volume.plane : 0
  }

  private gameLevel() {
    return this.gameEnabled ? GAME_LEVEL * this.volume.game : 0
  }

  private buildGraph(ctx: AudioContext) {
    this.master = ctx.createGain()
    this.master.gain.value = this.masterLevel()
    this.master.connect(ctx.destination)

    this.musicGain = ctx.createGain()
    this.musicGain.gain.value = this.musicWanted ? SILENT_FLOOR : 0
    this.musicDuck = ctx.createGain()
    this.musicDuck.connect(this.musicGain).connect(this.master)

    // Background playlist, routed through the music bus so it can be ducked.
    // The playlist loops forever: each track hands over to the next when it ends, a track
    // that fails to load is skipped, and the watchdog restarts playback if the browser
    // stalls or pauses it.
    this.music = new Audio(PLAYLIST[this.trackIndex])
    this.music.preload = 'auto'
    this.music.setAttribute('playsinline', '')
    this.music.addEventListener('ended', () => this.nextTrack())
    this.music.addEventListener('error', () => this.nextTrack())
    ctx.createMediaElementSource(this.music).connect(this.musicDuck)

    this.planeGain = ctx.createGain()
    this.planeGain.gain.value = this.planeLevel()
    this.planeDuck = ctx.createGain()
    this.planeDuck.connect(this.planeGain).connect(this.master)

    this.gameGain = ctx.createGain()
    this.gameGain.gain.value = this.gameLevel()
    this.gameGain.connect(this.master)

    const length = ctx.sampleRate * 2
    this.noise = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = this.noise.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1

    if (this.musicWanted) {
      this.musicGain.gain.setTargetAtTime(this.musicLevel(), ctx.currentTime, 0.8)
    }
  }

  private playMusic() {
    if (!this.music || document.visibilityState !== 'visible') return
    if (this.ctx && this.ctx.state !== 'running') void this.ctx.resume()
    if (!this.music.paused) return
    // play() can reject while the browser still considers audio locked; the next user
    // gesture (or the watchdog) tries again.
    this.music.play().catch(() => undefined)
  }

  private nextTrack() {
    if (!this.music) return
    this.trackIndex = (this.trackIndex + 1) % PLAYLIST.length
    this.music.src = PLAYLIST[this.trackIndex]!
    if (this.musicWanted) this.playMusic()
  }

  /** Every few seconds: if the soundtrack should be playing but isn't, start it again. */
  private startWatchdog() {
    let lastTime = -1
    let stuck = 0
    setInterval(() => {
      const m = this.music
      if (!m || !this.musicWanted || document.visibilityState !== 'visible') return
      if (m.paused) {
        this.playMusic()
        return
      }
      // Playing but not advancing (a stalled stream) for ~12 s: move on to the next track.
      stuck = m.currentTime === lastTime ? stuck + 1 : 0
      lastTime = m.currentTime
      if (stuck >= 3) {
        stuck = 0
        this.nextTrack()
      }
    }, 4000)
  }

  private blip(
    ctx: AudioContext,
    t: number,
    freq: number,
    dur: number,
    level: number,
    type: OscillatorType,
    out: AudioNode = this.gameGain,
  ) {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(level, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  private noiseSource(ctx: AudioContext) {
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    return src
  }

  private startEngine() {
    const ctx = this.planeCtx()
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
    filter.connect(gain).connect(this.planeDuck)
    osc.start(t)
    sub.start(t)
    this.engine = { osc, sub, filter, gain }
  }

  /**
   * A fresh output node for a one-shot cue. Whatever cue is still ringing is
   * faded out quickly first, so take-off, win and crash never overlap.
   */
  private claimCue(ctx: AudioContext) {
    const t = ctx.currentTime
    if (this.cue) {
      const old = this.cue
      old.gain.cancelScheduledValues(t)
      old.gain.setTargetAtTime(0, t, 0.04)
      setTimeout(() => old.disconnect(), 400)
    }
    const cue = ctx.createGain()
    cue.connect(this.gameGain)
    this.cue = cue
    return cue
  }

  private duckPlane(level: number, hold: number) {
    if (!this.ctx) return
    const g = this.planeDuck.gain
    const t = this.ctx.currentTime
    g.cancelScheduledValues(t)
    g.setTargetAtTime(level, t, 0.03)
    g.setTargetAtTime(1, t + hold, 0.3)
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
