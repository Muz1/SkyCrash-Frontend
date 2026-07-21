import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as lobbyService from '@/services/lobbyService'
import type { OnlinePlayer } from '@/types'

const POLL_INTERVAL_MS = 5_000

export const useLobbyStore = defineStore('lobby', () => {
  const onlinePlayers = ref<OnlinePlayer[]>([])
  const isLoading = ref(false)
  let pollIntervalId: ReturnType<typeof setInterval> | undefined

  async function fetchOnlinePlayers() {
    isLoading.value = true
    try {
      onlinePlayers.value = await lobbyService.getOnlinePlayers()
    } finally {
      isLoading.value = false
    }
  }

  function startPolling() {
    fetchOnlinePlayers()
    stopPolling()
    pollIntervalId = setInterval(fetchOnlinePlayers, POLL_INTERVAL_MS)
  }

  function stopPolling() {
    if (pollIntervalId) {
      clearInterval(pollIntervalId)
      pollIntervalId = undefined
    }
  }

  return { onlinePlayers, isLoading, fetchOnlinePlayers, startPolling, stopPolling }
})