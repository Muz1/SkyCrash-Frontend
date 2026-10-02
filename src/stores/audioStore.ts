import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { soundEngine, type AudioChannel } from '@/lib/soundEngine'
import { usePublicSettingsStore } from '@/stores/publicSettingsStore'

const STORAGE_KEY = 'skycrash_audio'

/** Persisted mixer settings. Volumes are 0–100; the flags are "channel on". */
type AudioPrefs = {
  master: boolean
  music: boolean
  plane: boolean
  game: boolean
  masterVolume: number
  musicVolume: number
  planeVolume: number
  gameVolume: number
}

/** Older saves had one combined `sfx` channel; it seeds both plane and game. */
type LegacyPrefs = Partial<AudioPrefs> & { sfx?: boolean; sfxVolume?: number }

const DEFAULTS: AudioPrefs = {
  master: true,
  music: true,
  plane: true,
  game: true,
  masterVolume: 80,
  musicVolume: 60,
  planeVolume: 80,
  gameVolume: 80,
}

function volumeOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : fallback
}

/** The player's saved mix, or null if they've never changed anything. */
function loadPrefs(): AudioPrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as LegacyPrefs
      const sfxVolume = volumeOr(parsed.sfxVolume, DEFAULTS.planeVolume)
      return {
        master: parsed.master ?? DEFAULTS.master,
        music: parsed.music ?? DEFAULTS.music,
        plane: parsed.plane ?? parsed.sfx ?? DEFAULTS.plane,
        game: parsed.game ?? parsed.sfx ?? DEFAULTS.game,
        masterVolume: volumeOr(parsed.masterVolume, DEFAULTS.masterVolume),
        musicVolume: volumeOr(parsed.musicVolume, DEFAULTS.musicVolume),
        planeVolume: volumeOr(parsed.planeVolume, sfxVolume),
        gameVolume: volumeOr(parsed.gameVolume, sfxVolume),
      }
    }
  } catch {
    // Storage unavailable (private mode, tests): fall back to defaults.
  }
  return null
}

export const useAudioStore = defineStore('audio', () => {
  const saved = loadPrefs()
  const prefs = saved ?? DEFAULTS
  /** True once the player has touched the mixer (here or in an earlier visit). */
  let customised = saved !== null

  const masterEnabled = ref(prefs.master)
  const musicEnabled = ref(prefs.music)
  const planeEnabled = ref(prefs.plane)
  const gameEnabled = ref(prefs.game)
  const masterVolume = ref(prefs.masterVolume)
  const musicVolume = ref(prefs.musicVolume)
  const planeVolume = ref(prefs.planeVolume)
  const gameVolume = ref(prefs.gameVolume)
  /** Whether the current route wants a soundtrack (the admin console doesn't). */
  const musicAllowed = ref(true)
  /** Plane or game sounds are on: drives the game screen's quick effects toggle. */
  const effectsEnabled = computed(() => planeEnabled.value || gameEnabled.value)

  function apply() {
    // Master mute also stops the music element and the engine drone rather than just zeroing the gain.
    soundEngine.setMasterEnabled(masterEnabled.value)
    soundEngine.setMusicEnabled(masterEnabled.value && musicEnabled.value && musicAllowed.value)
    soundEngine.setPlaneEnabled(masterEnabled.value && planeEnabled.value)
    soundEngine.setGameEnabled(masterEnabled.value && gameEnabled.value)
  }

  function applyVolumes() {
    soundEngine.setVolumes({
      master: masterVolume.value / 100,
      music: musicVolume.value / 100,
      plane: planeVolume.value / 100,
      game: gameVolume.value / 100,
    })
  }

  // Saved only when the player changes something, so admin defaults (below) keep
  // applying to players who never touched the mixer.
  function save() {
    customised = true
    try {
      const next: AudioPrefs = {
        master: masterEnabled.value,
        music: musicEnabled.value,
        plane: planeEnabled.value,
        game: gameEnabled.value,
        masterVolume: masterVolume.value,
        musicVolume: musicVolume.value,
        planeVolume: planeVolume.value,
        gameVolume: gameVolume.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Non-fatal: the preference just won't survive a reload.
    }
  }

  // Volumes first so the very first unlock already uses the saved mix.
  watch([masterVolume, musicVolume, planeVolume, gameVolume], applyVolumes, { immediate: true })
  watch([masterEnabled, musicEnabled, planeEnabled, gameEnabled, musicAllowed], apply, { immediate: true })

  // First-time players start from the admin's default mix (falls back to DEFAULTS offline).
  if (!customised) {
    void usePublicSettingsStore()
      .load()
      .then((settings) => {
        if (!settings || customised) return
        musicVolume.value = volumeOr(settings.audio?.music, musicVolume.value)
        planeVolume.value = volumeOr(settings.audio?.plane, planeVolume.value)
        gameVolume.value = volumeOr(settings.audio?.game, gameVolume.value)
      })
  }

  const flags: Record<AudioChannel, typeof masterEnabled> = {
    master: masterEnabled,
    music: musicEnabled,
    plane: planeEnabled,
    game: gameEnabled,
  }
  const volumes: Record<AudioChannel, typeof masterVolume> = {
    master: masterVolume,
    music: musicVolume,
    plane: planeVolume,
    game: gameVolume,
  }

  function toggle(channel: AudioChannel) {
    soundEngine.unlock()
    flags[channel].value = !flags[channel].value
    save()
  }

  const toggleMaster = () => toggle('master')
  const toggleMusic = () => toggle('music')
  const togglePlane = () => toggle('plane')
  const toggleGame = () => toggle('game')

  /** Game-screen shortcut: mutes (or restores) plane and game sounds together. */
  function toggleEffects() {
    soundEngine.unlock()
    const on = !effectsEnabled.value
    planeEnabled.value = on
    gameEnabled.value = on
    save()
  }

  function setVolume(channel: AudioChannel, value: number) {
    volumes[channel].value = volumeOr(value, 0)
    save()
  }

  return {
    masterEnabled,
    musicEnabled,
    planeEnabled,
    gameEnabled,
    effectsEnabled,
    masterVolume,
    musicVolume,
    planeVolume,
    gameVolume,
    musicAllowed,
    toggle,
    toggleMaster,
    toggleMusic,
    togglePlane,
    toggleGame,
    toggleEffects,
    setVolume,
  }
})
