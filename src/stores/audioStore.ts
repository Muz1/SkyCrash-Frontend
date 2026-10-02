import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { soundEngine } from '@/lib/soundEngine'

const STORAGE_KEY = 'skycrash_audio'

/** Persisted mixer settings. Volumes are 0–100; the `music`/`sfx` flags keep their original keys. */
type AudioPrefs = {
  master: boolean
  music: boolean
  sfx: boolean
  masterVolume: number
  musicVolume: number
  sfxVolume: number
}

const DEFAULTS: AudioPrefs = { master: true, music: true, sfx: true, masterVolume: 80, musicVolume: 60, sfxVolume: 80 }

function volumeOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : fallback
}

function loadPrefs(): AudioPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AudioPrefs>
      return {
        master: parsed.master ?? DEFAULTS.master,
        music: parsed.music ?? DEFAULTS.music,
        sfx: parsed.sfx ?? DEFAULTS.sfx,
        masterVolume: volumeOr(parsed.masterVolume, DEFAULTS.masterVolume),
        musicVolume: volumeOr(parsed.musicVolume, DEFAULTS.musicVolume),
        sfxVolume: volumeOr(parsed.sfxVolume, DEFAULTS.sfxVolume),
      }
    }
  } catch {
    // Storage unavailable (private mode, tests): fall back to defaults.
  }
  return { ...DEFAULTS }
}

export const useAudioStore = defineStore('audio', () => {
  const prefs = loadPrefs()
  const masterEnabled = ref(prefs.master)
  const musicEnabled = ref(prefs.music)
  const sfxEnabled = ref(prefs.sfx)
  const masterVolume = ref(prefs.masterVolume)
  const musicVolume = ref(prefs.musicVolume)
  const sfxVolume = ref(prefs.sfxVolume)
  /** Whether the current route wants a soundtrack (the admin console doesn't). */
  const musicAllowed = ref(true)

  function apply() {
    // Master mute also stops the music element and the engine drone rather than just zeroing the gain.
    soundEngine.setMasterEnabled(masterEnabled.value)
    soundEngine.setMusicEnabled(masterEnabled.value && musicEnabled.value && musicAllowed.value)
    soundEngine.setSfxEnabled(masterEnabled.value && sfxEnabled.value)
  }

  function applyVolumes() {
    soundEngine.setVolumes({
      master: masterVolume.value / 100,
      music: musicVolume.value / 100,
      sfx: sfxVolume.value / 100,
    })
  }

  const persisted = [masterEnabled, musicEnabled, sfxEnabled, masterVolume, musicVolume, sfxVolume]
  watch(persisted, () => {
    try {
      const next: AudioPrefs = {
        master: masterEnabled.value,
        music: musicEnabled.value,
        sfx: sfxEnabled.value,
        masterVolume: masterVolume.value,
        musicVolume: musicVolume.value,
        sfxVolume: sfxVolume.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Non-fatal: the preference just won't survive a reload.
    }
  })
  // Volumes first so the very first unlock already uses the saved mix.
  watch([masterVolume, musicVolume, sfxVolume], applyVolumes, { immediate: true })
  watch([masterEnabled, musicEnabled, sfxEnabled, musicAllowed], apply, { immediate: true })

  function toggleMaster() {
    soundEngine.unlock()
    masterEnabled.value = !masterEnabled.value
  }

  function toggleMusic() {
    soundEngine.unlock()
    musicEnabled.value = !musicEnabled.value
  }

  function toggleSfx() {
    soundEngine.unlock()
    sfxEnabled.value = !sfxEnabled.value
  }

  function setVolume(channel: 'master' | 'music' | 'sfx', value: number) {
    const v = volumeOr(value, 0)
    if (channel === 'master') masterVolume.value = v
    else if (channel === 'music') musicVolume.value = v
    else sfxVolume.value = v
  }

  return {
    masterEnabled,
    musicEnabled,
    sfxEnabled,
    masterVolume,
    musicVolume,
    sfxVolume,
    musicAllowed,
    toggleMaster,
    toggleMusic,
    toggleSfx,
    setVolume,
  }
})
