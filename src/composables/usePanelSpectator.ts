import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { HubConnection } from '@microsoft/signalr'
import { getConnection } from '@/services/signalr'
import { useGameStore } from '@/stores/gameStore'
import { usePrivateLobbyStore } from '@/stores/privateLobbyStore'
import * as accessLinks from '@/services/accessLinkService'
import { apiError } from '@/lib/apiError'
import type { LobbyRoundBet } from '@/types'

type Watch = { lobbyId: string; roundId: string | null; bets: LobbyRoundBet[] }

/**
 * Puts an admin "inside" the panel lobby on the real game screen, watching only: the lobby
 * (Panel Squadron) is loaded into the private-lobby store as if the admin were a member, and
 * the admin's game connection joins the lobby's group (GameHub.WatchPanelLobby), so the six
 * pilots' bets and cash-outs arrive live. The server still refuses any bet from an admin.
 */
export function usePanelSpectator() {
  const gameStore = useGameStore()
  const privateLobbyStore = usePrivateLobbyStore()
  const error = ref<string | null>(null)
  const ready = ref(false)
  let connection: HubConnection | null = null
  let watchedLobbyId: string | null = null
  let alive = true
  let timer: ReturnType<typeof setInterval> | null = null

  /** Members as the lobby store expects them (the first member stands in as host). */
  async function loadLobby() {
    try {
      const o = await accessLinks.getPanelOverview()
      if (!o.lobbyId) {
        error.value = 'The panel lobby is empty: it fills as soon as a pilot opens their link or QR code.'
        privateLobbyStore.lobby = null
        return
      }
      const host = o.members[0]
      privateLobbyStore.lobby = {
        lobbyId: o.lobbyId,
        name: o.lobbyName,
        inviteCode: o.inviteCode,
        hostPlayerId: host?.playerId ?? '',
        hostUsername: host?.username ?? '',
        members: o.members.map((m, i) => ({
          playerId: m.playerId,
          username: m.username,
          displayedAchievementKey: null,
          joinedAtUtc: m.joinedAtUtc,
          isHost: i === 0,
          equippedCraftId: m.equippedCraftId,
        })),
        maxPlayers: Math.max(6, o.members.length),
      }
      error.value = null
    } catch (e) {
      error.value =
        apiError(e).status === 404
          ? 'The server needs redeploying before you can watch the panel.'
          : 'Could not load the panel lobby.'
    }
  }

  /** The app opens the game connection after sign-in; wait for it (up to ~15 s). */
  async function connected(): Promise<HubConnection | null> {
    for (let i = 0; i < 30 && alive; i++) {
      const c = getConnection()
      if (c.state === 'Connected') return c
      await new Promise((r) => setTimeout(r, 500))
    }
    return null
  }

  /** Joins the lobby's group and catches up on this round's bets. Safe to repeat. */
  async function catchUp() {
    connection ??= await connected()
    if (!connection) return
    try {
      const w = await connection.invoke<Watch | null>('WatchPanelLobby')
      watchedLobbyId = w?.lobbyId ?? null
      if (w?.roundId) gameStore.applyLobbyRoundBets(w.roundId, w.bets)
    } catch {
      // Live events may still arrive; the catch-up is a nicety.
    }
  }

  const onMembership = () => void loadLobby()
  const onReconnected = () => void catchUp()

  onMounted(async () => {
    await loadLobby()
    await catchUp()
    connection?.on('LobbyMemberJoined', onMembership)
    connection?.on('LobbyMemberLeft', onMembership)
    connection?.onreconnected(onReconnected)
    // Pilots' planes and who's in the lobby can change between rounds.
    timer = setInterval(() => void loadLobby(), 20_000)
    ready.value = true
  })

  onBeforeUnmount(() => {
    alive = false
    if (timer) clearInterval(timer)
    connection?.off('LobbyMemberJoined', onMembership)
    connection?.off('LobbyMemberLeft', onMembership)
    if (connection && watchedLobbyId) void connection.invoke('UnwatchPanelLobby', watchedLobbyId).catch(() => undefined)
    // The admin was never really a member: leave the store as it was.
    privateLobbyStore.lobby = null
  })

  return { error, ready, catchUp }
}
