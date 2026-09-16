import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as playerService from '@/services/playerService'
import type { PlayerProfile, UpdateProfilePayload } from '@/types'

export const usePlayerStore = defineStore('player', () => {
  const profile = ref<PlayerProfile | null>(null)
  const isLoading = ref(false)

  let inFlightRequest: Promise<void> | null = null

  async function fetchProfile() {
    if (inFlightRequest) {
      return inFlightRequest
    }

    isLoading.value = true
    inFlightRequest = (async () => {
      try {
        profile.value = await playerService.getMyProfile()
      } finally {
        isLoading.value = false
        inFlightRequest = null
      }
    })()

    return inFlightRequest
  }

  async function updateProfile(payload: UpdateProfilePayload) {
    profile.value = await playerService.updateMyProfile(payload)
  }

  function clear() {
    profile.value = null
  }

  return { profile, isLoading, fetchProfile, updateProfile, clear }
})