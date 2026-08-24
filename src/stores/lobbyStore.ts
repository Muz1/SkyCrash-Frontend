import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as lobbyService from '@/services/lobbyService'
import type { OnlinePlayer } from '@/types'

export const useLobbyStore = defineStore('lobby', () => {
  const onlinePlayers = ref<OnlinePlayer[]>([])
  const isLoading = ref(false)

  async function fetchOnlinePlayers() {
    isLoading.value = true
    try {
      onlinePlayers.value = await lobbyService.getOnlinePlayers()
    } finally {
      isLoading.value = false
    }
  }

  function addOnlinePlayer(player: OnlinePlayer) {
    const alreadyPresent = onlinePlayers.value.some((p) => p.playerId === player.playerId)
    if (!alreadyPresent) {
      onlinePlayers.value = [...onlinePlayers.value, player].sort((a, b) =>
        a.username.localeCompare(b.username)
      )
    }
  }

  function removeOnlinePlayer(playerId: string) {
    onlinePlayers.value = onlinePlayers.value.filter((p) => p.playerId !== playerId)
  }

  return { onlinePlayers, isLoading, fetchOnlinePlayers, addOnlinePlayer, removeOnlinePlayer }
})