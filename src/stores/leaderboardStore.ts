import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as leaderboardService from '@/services/leaderboardService'
import type { LeaderboardData, LeaderboardPeriod } from '@/types'

export const useLeaderboardStore = defineStore('leaderboard', () => {
  const data = ref<LeaderboardData | null>(null)
  const period = ref<LeaderboardPeriod>('all')
  const isLoading = ref(false)

  async function fetchLeaderboard(next: LeaderboardPeriod = period.value) {
    period.value = next
    isLoading.value = true
    try {
      const result = await leaderboardService.getLeaderboard(next)
      // A slower answer for a tab the player already left is dropped.
      if (period.value === next) data.value = result
    } finally {
      if (period.value === next) isLoading.value = false
    }
  }

  return { data, period, isLoading, fetchLeaderboard }
})
