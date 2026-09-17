import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as adminRoundService from '@/services/adminRoundService'
import type { AdminCurrentRound } from '@/types'

const POLL_INTERVAL_MS = 1_000

export const useAdminRoundStore = defineStore('adminRound', () => {
  const round = ref<AdminCurrentRound | null>(null)
  const isLoading = ref(false)
  let pollId: ReturnType<typeof setInterval> | undefined

  async function fetchCurrentRound() {
    isLoading.value = true
    try {
      round.value = await adminRoundService.getCurrentRound()
    } finally {
      isLoading.value = false
    }
  }

  function startPolling() {
    fetchCurrentRound()
    stopPolling()
    pollId = setInterval(fetchCurrentRound, POLL_INTERVAL_MS)
  }

  function stopPolling() {
    if (pollId) {
      clearInterval(pollId)
      pollId = undefined
    }
  }

  return { round, isLoading, fetchCurrentRound, startPolling, stopPolling }
})
