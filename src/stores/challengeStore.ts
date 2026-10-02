import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as challengeService from '@/services/challengeService'
import type { Challenge, ChallengeBadge } from '@/types'

export const useChallengeStore = defineStore('challenge', () => {
  const challenges = ref<Challenge[]>([])
  const badges = ref<ChallengeBadge[]>([])
  const isLoading = ref(false)

  async function fetchTodayChallenges() {
    isLoading.value = true
    try {
      challenges.value = await challengeService.getTodayChallenges()
    } finally {
      isLoading.value = false
    }
  }

  async function fetchBadges() {
    badges.value = await challengeService.getBadges()
  }

  function clear() {
    challenges.value = []
    badges.value = []
  }

  return { challenges, badges, isLoading, fetchTodayChallenges, fetchBadges, clear }
})
