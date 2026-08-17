import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as operationsService from '@/services/operationsService'
import type { OperationsMetrics } from '@/types'

const POLL_INTERVAL_MS = 5_000

export const useOperationsStore = defineStore('operations', () => {
  const metrics = ref<OperationsMetrics | null>(null)
  const isLoading = ref(false)
  let pollId: ReturnType<typeof setInterval> | undefined

  async function fetchMetrics() {
    isLoading.value = true
    try {
      metrics.value = await operationsService.getMetrics()
    } finally {
      isLoading.value = false
    }
  }

  function startPolling() {
    fetchMetrics()
    stopPolling()
    pollId = setInterval(fetchMetrics, POLL_INTERVAL_MS)
  }

  function stopPolling() {
    if (pollId) {
      clearInterval(pollId)
      pollId = undefined
    }
  }

  return { metrics, isLoading, fetchMetrics, startPolling, stopPolling }
})
