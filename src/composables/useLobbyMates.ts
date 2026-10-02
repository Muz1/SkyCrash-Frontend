import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/AuthStore'
import { useLobbyStore } from '@/stores/lobbyStore'
import { usePrivateLobbyStore } from '@/stores/privateLobbyStore'
import { craftForMember, skyForMember, type LobbyMate } from '@/lib/lobby'

/**
 * The other pilots sharing the player's lobby, for the background fleet.
 * Inside a private squadron that's its members; otherwise the public lobby,
 * i.e. everyone online. Never more than the lobby capacity minus the player's own seat.
 */
export function useLobbyMates(options: { fetch?: boolean } = {}) {
  const authStore = useAuthStore()
  const lobbyStore = useLobbyStore()
  const privateLobbyStore = usePrivateLobbyStore()

  if (options.fetch) {
    onMounted(() => {
      if (!authStore.isAuthenticated) return
      if (!privateLobbyStore.lobby) void privateLobbyStore.fetchMyLobby().catch(() => undefined)
      if (lobbyStore.onlinePlayers.length === 0) void lobbyStore.fetchOnlinePlayers().catch(() => undefined)
    })
  }

  const mates = computed<LobbyMate[]>(() => {
    const source = privateLobbyStore.lobby?.members ?? lobbyStore.onlinePlayers
    return source
      .filter((p) => p.playerId !== authStore.playerId)
      .slice(0, Math.max(0, privateLobbyStore.capacity - 1))
      .map((p) => ({ playerId: p.playerId, username: p.username, craftId: craftForMember(p), skyId: skyForMember(p) }))
  })

  return { mates }
}
