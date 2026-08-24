import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as leaderboardService from '@/services/leaderboardService'
import type { LeaderboardData } from '@/types'

export const useLeaderboardStore = defineStore('leaderboard', () => {
  const data = ref<LeaderboardData | null>(null)
  const isLoading = ref(false)

  async function fetchLeaderboard() {
    isLoading.value = true
    try {
      data.value = await leaderboardService.getLeaderboard()
    } finally {
      isLoading.value = false
    }
  }

  return { data, isLoading, fetchLeaderboard }
})
