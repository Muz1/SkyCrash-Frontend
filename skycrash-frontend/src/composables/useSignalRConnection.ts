import { onMounted, onUnmounted, watch } from 'vue'
import { getConnection, stopConnection } from '@/services/signalr'
import { useAuthStore } from '@/stores/AuthStore'
import { useLobbyStore } from '@/stores/lobbyStore'

export function useSignalRConnection() {
  const authStore = useAuthStore()
  const lobbyStore = useLobbyStore()

  async function start() {
    const connection = getConnection()

    if (connection.state === 'Disconnected') {
      connection.on('PlayerOnline', (player: { playerId: string; username: string }) => {
        lobbyStore.addOnlinePlayer(player)
      })

      connection.on('PlayerOffline', (payload: { playerId: string }) => {
        lobbyStore.removeOnlinePlayer(payload.playerId)
      })

      try {
        await connection.start()
      } catch (err) {
        console.error('SignalR connection failed to start:', err)
      }
    }
  }

  onMounted(() => {
    if (authStore.isAuthenticated) {
      start()
    }
  })

  watch(
    () => authStore.isAuthenticated,
    async (isAuthenticated) => {
      if (isAuthenticated) {
        await start()
      } else {
        await stopConnection()
      }
    }
  )

  onUnmounted(() => {
    stopConnection()
  })
}