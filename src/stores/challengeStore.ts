import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as challengeService from '@/services/challengeService'
import type { Challenge } from '@/types'

export const useChallengeStore = defineStore('challenge', () => {
  const challenges = ref<Challenge[]>([])
  const isLoading = ref(false)

  async function fetchTodayChallenges() {
    isLoading.value = true
    try {
      challenges.value = await challengeService.getTodayChallenges()
    } finally {
      isLoading.value = false
    }
  }

  function clear() {
    challenges.value = []
  }

  return { challenges, isLoading, fetchTodayChallenges, clear }
})
