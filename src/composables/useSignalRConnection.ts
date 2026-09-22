import { onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getConnection, stopConnection } from '@/services/signalr'
import { useAuthStore } from '@/stores/AuthStore'
import { useLobbyStore } from '@/stores/lobbyStore'
import { useGameStore, type RoundPhase } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'
import { usePrivateLobbyStore } from '@/stores/privateLobbyStore'
import { useToastStore } from '@/stores/toastStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { useChallengeStore } from '@/stores/challengeStore'
import { badgeFor } from '@/lib/achievements'


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
  autoCashoutTarget?: number | null
}

type BetRejectedPayload = {
  message: string
}

type BetPlacedByPlayerPayload = {
  playerId: string
  username: string
  displayedAchievementKey: string | null
  amount: number
}

type CashOutConfirmedPayload = {
  cashOutMultiplier: number
  payout: number
  auto?: boolean
}

type CashOutRejectedPayload = {
  message : string
}

type PlayerCashedOutPayload = {
  playerId: string
  username: string
  displayedAchievementKey: string | null
  cashOutMultiplier: number
  payout: number
}

type LobbyMemberJoinedPayload = {
  lobbyId: string
  playerId: string
  username: string
  displayedAchievementKey: string | null
}

type LobbyMemberLeftPayload = {
  lobbyId: string
  playerId: string
}

type LobbyHostChangedPayload = {
  lobbyId: string
  hostPlayerId: string
  hostUsername: string
}

type AchievementUnlockedPayload = {
  achievementKey: string
  name: string
  description: string
}

type ChallengeCompletedPayload = {
  challengeId: string
  description: string
  rewardCredits: number
  newBalance: number
}

type DisplayedAchievementChangedPayload = {
  playerId: string
  displayedAchievementKey: string | null
}

export function useSignalRConnection() {
  const authStore = useAuthStore()
  const lobbyStore = useLobbyStore()
  const router = useRouter()

  async function start() {
    const connection = getConnection()

    if (connection.state === 'Disconnected') {
      connection.on('PlayerOnline', (player: { playerId: string; username: string; displayedAchievementKey: string | null }) => {
        lobbyStore.addOnlinePlayer(player)
      })

      connection.on('PlayerOffline', (payload: { playerId: string }) => {
        lobbyStore.removeOnlinePlayer(payload.playerId)
      })

      // Sent by the admin "block" action so an already-connected, still-unexpired
      // session is cut off immediately instead of waiting for the JWT to expire.
      connection.on('AccountBlocked', () => {
        authStore.logout()
        usePlayerStore().clear()
        useLobbyStore().clear()
        useAchievementStore().clear()
        useChallengeStore().clear()
        usePrivateLobbyStore().clear()
        router.push({ name: 'login', query: { blocked: '1' } })
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
    connection.on('CashOutConfirmed', (payload: CashOutConfirmedPayload) => {
  gameStore.onCashOutConfirmed(payload)
  usePlayerStore().fetchProfile()
})
connection.on('CashOutRejected', (payload: CashOutRejectedPayload) => {
  gameStore.onCashOutRejected(payload)
})
connection.on('PlayerCashedOut', (payload: PlayerCashedOutPayload) => {
  // Reuse the same "bets this round" list for cash-out atmosphere too —
  // shown as a distinct, badge-aware entry in GameView.vue.
  gameStore.onPlayerCashedOut(payload)
})

    const privateLobbyStore = usePrivateLobbyStore()
    const toastStore = useToastStore()
    const achievementStore = useAchievementStore()
    const challengeStore = useChallengeStore()

    connection.on('LobbyMemberJoined', (payload: LobbyMemberJoinedPayload) => {
      privateLobbyStore.memberJoined(payload)
    })
    connection.on('LobbyMemberLeft', (payload: LobbyMemberLeftPayload) => {
      privateLobbyStore.memberLeft(payload.playerId)
    })
    connection.on('LobbyHostChanged', (payload: LobbyHostChangedPayload) => {
      privateLobbyStore.hostChanged(payload.hostPlayerId, payload.hostUsername)
    })
    connection.on('LobbyClosed', () => {
      privateLobbyStore.closed()
    })
    connection.on('DisplayedAchievementChanged', (payload: DisplayedAchievementChangedPayload) => {
      lobbyStore.updateDisplayedAchievement(payload.playerId, payload.displayedAchievementKey)
      privateLobbyStore.updateDisplayedAchievement(payload.playerId, payload.displayedAchievementKey)
    })
    connection.on('AchievementUnlocked', (payload: AchievementUnlockedPayload) => {
      achievementStore.fetchAchievements()
      toastStore.push({
        title: 'Achievement Unlocked',
        message: `${payload.name} — ${payload.description}`,
        accent: 'ember',
        imageSrc: badgeFor(payload.achievementKey),
      })
    })
    connection.on('ChallengeCompleted', (payload: ChallengeCompletedPayload) => {
      challengeStore.fetchTodayChallenges()
      usePlayerStore().fetchProfile()
      toastStore.push({
        title: 'Challenge Complete',
        message: `${payload.description} — +${payload.rewardCredits.toLocaleString()} credits`,
        accent: 'lime',
      })
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
