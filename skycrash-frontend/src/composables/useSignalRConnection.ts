import { onMounted, onUnmounted, watch } from 'vue'
import { getConnection, stopConnection } from '@/services/signalr'
import { useAuthStore } from '@/stores/AuthStore'
import { useLobbyStore } from '@/stores/lobbyStore'
import { useGameStore, type RoundPhase } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'


type RoundSnapshot = {
  roundId: string
  roundNumber: number
  status: RoundPhase
  serverSeedHash: string
  currentMultiplier: number
  crashMultiplier: number | null
  countdownSeconds: number | null
}

type RoundWaitingPayload = {
  roundId: string
  roundNumber: number
  serverSeedHash: string
  countdownSeconds: number
}

type MultiplierTickPayload = {
  multiplier: number
}

type RoundCrashedPayload = {
  crashMultiplier: number
  serverSeed: string
}

type BetConfirmedPayload = {
  betId: string
  amount: number
}

type BetRejectedPayload = {
  message: string
}

type BetPlacedByPlayerPayload = {
  playerId: string
  username: string
  amount: number
}

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

    const gameStore = useGameStore()

    connection.on('RoundSnapshot', (snapshot: RoundSnapshot) => {
      gameStore.applySnapshot(snapshot)
    })
    connection.on('RoundWaiting', (payload: RoundWaitingPayload) => {
      gameStore.onRoundWaiting(payload)
    })
    connection.on('RoundStarted', () => {
      gameStore.onRoundStarted()
    })
    connection.on('MultiplierTick', (payload: MultiplierTickPayload) => {
      gameStore.onMultiplierTick(payload)
    })
    connection.on('RoundCrashed', (payload: RoundCrashedPayload) => {
      gameStore.onRoundCrashed(payload)
    })
    connection.on('BetConfirmed', (payload: BetConfirmedPayload) => {
      gameStore.onBetConfirmed(payload)
      usePlayerStore().fetchProfile() // refresh nav bar balance
    })
    connection.on('BetRejected', (payload: BetRejectedPayload) => {
      gameStore.onBetRejected(payload)
    })
    connection.on('BetPlacedByPlayer', (payload: BetPlacedByPlayerPayload) => {
      gameStore.onBetPlacedByPlayer(payload)
    })
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
    },
  )

  onUnmounted(() => {
    stopConnection()
  })
}
