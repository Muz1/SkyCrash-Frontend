import { computed, onMounted, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'
import { usePrivateLobbyStore } from '@/stores/privateLobbyStore'
import { useHangarStore } from '@/stores/hangarStore'
import * as gameService from '@/services/gameService'
import { CRAFTS, DEFAULT_CRAFT, type CraftId } from '@/lib/craft'

/** Where a pilot is in the current round. */
export type FlightStatus = 'spectating' | 'ready' | 'flying' | 'cashed' | 'crashed'

export interface FlightRow {
  playerId: string
  username: string
  achievementKey: string | null
  craftId: CraftId
  isMe: boolean
  isHost: boolean
  /** Stake this round, or null if they're sitting it out. */
  bet: number | null
  status: FlightStatus
  cashOutMultiplier: number | null
}

const CRAFT_IDS = new Set<string>(CRAFTS.map((c) => c.id))
function toCraft(id: string | null | undefined): CraftId {
  return id && CRAFT_IDS.has(id) ? (id as CraftId) : DEFAULT_CRAFT
}

/**
 * The live "who's flying" board for the game screen: me plus everyone in my private lobby,
 * with their plane, stake and status this round. Only lobby-mates are ever included (the
 * server only sends their bets); when I'm not in a lobby the board is just me.
 */
export function useLobbyFlight() {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const privateLobbyStore = usePrivateLobbyStore()
  const hangarStore = useHangarStore()

  const inLobby = computed(() => privateLobbyStore.lobby !== null)
  const lobbyName = computed(() => privateLobbyStore.lobby?.name ?? null)

  function statusFor(hasBet: boolean, cashedOut: boolean): FlightStatus {
    if (!hasBet) return 'spectating'
    if (cashedOut) return 'cashed'
    if (gameStore.phase === 'Running') return 'flying'
    if (gameStore.phase === 'Crashed') return 'crashed'
    return 'ready'
  }

  const me = computed<FlightRow>(() => {
    const cashed = gameStore.cashOutStatus === 'CashedOut'
    const hasBet = gameStore.myBetAmount !== null && (gameStore.myBetStatus === 'Placed' || cashed)
    return {
      playerId: playerStore.profile?.playerId ?? 'me',
      username: playerStore.profile?.username ?? 'You',
      achievementKey: playerStore.profile?.displayedAchievementKey ?? null,
      craftId: hangarStore.craftId,
      isMe: true,
      isHost: privateLobbyStore.lobby?.hostPlayerId === playerStore.profile?.playerId,
      bet: hasBet ? gameStore.myBetAmount : null,
      status: statusFor(hasBet, cashed),
      cashOutMultiplier: cashed ? (gameStore.cashOutResult?.cashOutMultiplier ?? null) : null,
    }
  })

  /** Lobby-mates (not me), pilots with a stake first. */
  const mates = computed<FlightRow[]>(() => {
    const lobby = privateLobbyStore.lobby
    if (!lobby) return []
    const myId = playerStore.profile?.playerId
    return lobby.members
      .filter((m) => m.playerId !== myId)
      .map((m) => {
        const bet = gameStore.lobbyBets[m.playerId]
        return {
          playerId: m.playerId,
          username: m.username,
          achievementKey: m.displayedAchievementKey,
          craftId: toCraft(bet?.craftId ?? m.equippedCraftId),
          isMe: false,
          isHost: m.isHost,
          bet: bet?.amount ?? null,
          status: statusFor(!!bet, bet?.status === 'CashedOut'),
          cashOutMultiplier: bet?.cashOutMultiplier ?? null,
        }
      })
      .sort((a, b) => Number(b.bet !== null) - Number(a.bet !== null))
  })

  /** Load the lobby (direct visits to /game) and catch up on bets already placed this round. */
  async function refresh() {
    const roundId = gameStore.roundId
    if (!roundId || !inLobby.value) return
    try {
      gameStore.applyLobbyRoundBets(roundId, await gameService.getLobbyRoundBets())
    } catch {
      // Live broadcasts still fill the board; the catch-up is a nicety.
    }
  }

  onMounted(async () => {
    if (!privateLobbyStore.lobby) {
      await privateLobbyStore.fetchMyLobby().catch(() => undefined)
    }
    await refresh()
  })
  watch(
    () => [gameStore.roundId, privateLobbyStore.lobby?.lobbyId] as const,
    ([, lobbyId], old) => {
      // A new round starts empty; only a lobby change or first connect needs a catch-up.
      if (lobbyId !== old?.[1] || gameStore.phase !== 'Waiting') void refresh()
    },
  )

  return { inLobby, lobbyName, me, mates }
}
