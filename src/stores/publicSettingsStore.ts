import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as publicSettingsService from '@/services/publicSettingsService'
import type { PublicSettings } from '@/types'

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

  return { settings, load, refresh }
})
