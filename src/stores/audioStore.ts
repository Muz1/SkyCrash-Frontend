import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { soundEngine } from '@/lib/soundEngine'

const STORAGE_KEY = 'skycrash_audio'

type AudioPrefs = { music: boolean; sfx: boolean }

function loadPrefs(): AudioPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AudioPrefs>
      return { music: parsed.music ?? true, sfx: parsed.sfx ?? true }
    }
  } catch {
    // Storage unavailable (private mode, tests): fall back to defaults.
  }
  return { music: true, sfx: true }
}

export const useAudioStore = defineStore('audio', () => {
  const prefs = loadPrefs()
  const musicEnabled = ref(prefs.music)
  const sfxEnabled = ref(prefs.sfx)
  /** Whether the current route wants a soundtrack (the admin console doesn't). */
  const musicAllowed = ref(true)

  function apply() {
    soundEngine.setMusicEnabled(musicEnabled.value && musicAllowed.value)
    soundEngine.setSfxEnabled(sfxEnabled.value)
  }

  watch([musicEnabled, sfxEnabled], () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ music: musicEnabled.value, sfx: sfxEnabled.value }))
    } catch {
      // Non-fatal: the preference just won't survive a reload.
    }
  })
  watch([musicEnabled, sfxEnabled, musicAllowed], apply, { immediate: true })

  function toggleMusic() {
    soundEngine.unlock()
    musicEnabled.value = !musicEnabled.value
  }

  function toggleSfx() {
    soundEngine.unlock()
    sfxEnabled.value = !sfxEnabled.value
  }

  return { musicEnabled, sfxEnabled, musicAllowed, toggleMusic, toggleSfx }
})
