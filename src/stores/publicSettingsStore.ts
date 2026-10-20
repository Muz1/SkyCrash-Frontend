import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as publicSettingsService from '@/services/publicSettingsService'
import type { PublicGameRules, PublicSettings } from '@/types'

/**
 * Admin-configured values the player app needs (lobby size, default volumes).
 * Fetched once per page load; stays null if the server can't be reached, so
 * callers keep their built-in defaults.
 */
export const usePublicSettingsStore = defineStore('publicSettings', () => {
  const settings = ref<PublicSettings | null>(null)
  let request: Promise<PublicSettings | null> | null = null

  function load() {
    request ??= publicSettingsService
      .getPublicSettings()
      .then((s) => (settings.value = s))
      .catch(() => {
        // Allow a retry later (e.g. the API was still starting up).
        request = null
        return null
      })
    return request
  }

  /** Fetch again (e.g. on each page visit) so admin changes such as the payments switch show up. */
  function refresh() {
    request = null
    return load()
  }

  /** Published game limits (min/max bet, max multiplier, caps); null on older servers. */
  const rules = computed<PublicGameRules | null>(() => settings.value?.rules ?? null)
  /** Google sign-in shows only when the server has a client id. */
  const googleClientId = computed(() => settings.value?.googleClientId || null)

  return { settings, rules, googleClientId, load, refresh }
})
