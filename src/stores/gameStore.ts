import { defineStore } from 'pinia'
import { ref } from 'vue'

export type RoundPhase = 'Idle' | 'Waiting' | 'Running' | 'Crashed'

export const useGameStore = defineStore('game', () => {
  const roundId = ref<string | null>(null)
  const roundNumber = ref<number | null>(null)
  const phase = ref<RoundPhase>('Idle')
  const serverSeedHash = ref<string | null>(null)
  const currentMultiplier = ref(1.0)
  const countdownSeconds = ref<number | null>(null)
  const lastCrashPoints = ref<number[]>([])
  const lastRevealedSeed = ref<string | null>(null)
  const myBetAmount = ref<number | null>(null)
  const myBetStatus = ref<'None' | 'Placed' | 'Rejected'>('None')
  const myAutoCashoutTarget = ref<number | null>(null)
  const betRejectionReason = ref<string | null>(null)
  const roundBets = ref<
    {
      playerId: string
      username: string
      displayedAchievementKey: string | null
      amount: number
      kind: 'bet' | 'cashout'
      cashOutMultiplier?: number
    }[]
  >([])
  const cashOutStatus = ref<'None' | 'CashedOut' | 'Rejected'>('None')
  const cashOutResult = ref<{ cashOutMultiplier: number; payout: number; auto: boolean } | null>(null)
  const cashOutRejectionReason = ref<string | null>(null)

  let countdownTimer: ReturnType<typeof setInterval> | null = null

  function stopCountdownTimer() {
    if (countdownTimer !== null) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }

  function startCountdownTimer() {
    stopCountdownTimer()
    countdownTimer = setInterval(() => {
      if (countdownSeconds.value === null || countdownSeconds.value <= 0) {
        stopCountdownTimer()
        return
      }
      countdownSeconds.value -= 1
    }, 1000)
  }

  function applySnapshot(snapshot: {
    roundId: string
    roundNumber: number
    status: RoundPhase
    serverSeedHash: string
    currentMultiplier: number
    crashMultiplier: number | null
    countdownSeconds: number | null
  }) {
    roundId.value = snapshot.roundId
    roundNumber.value = snapshot.roundNumber
    phase.value = snapshot.status
    serverSeedHash.value = snapshot.serverSeedHash
    currentMultiplier.value = snapshot.currentMultiplier
    countdownSeconds.value = snapshot.countdownSeconds

    if (snapshot.status === 'Waiting' && snapshot.countdownSeconds !== null) {
      startCountdownTimer()
    } else {
      stopCountdownTimer()
    }
  }

  function onRoundWaiting(payload: {
    roundId: string
    roundNumber: number
    serverSeedHash: string
    countdownSeconds: number
  }) {
    roundId.value = payload.roundId
    roundNumber.value = payload.roundNumber
    serverSeedHash.value = payload.serverSeedHash
    countdownSeconds.value = payload.countdownSeconds
    currentMultiplier.value = 1.0
    phase.value = 'Waiting'
    myBetAmount.value = null
    myBetStatus.value = 'None'
    myAutoCashoutTarget.value = null
    betRejectionReason.value = null
    roundBets.value = []
    cashOutStatus.value = 'None'
    cashOutResult.value = null
    cashOutRejectionReason.value = null
    startCountdownTimer()
  }

  function onRoundStarted() {
    phase.value = 'Running'
    countdownSeconds.value = null
    currentMultiplier.value = 1.0
    stopCountdownTimer()
  }

  function onMultiplierTick(payload: { multiplier: number }) {
    currentMultiplier.value = payload.multiplier
  }

  function onRoundCrashed(payload: { crashMultiplier: number; serverSeed: string }) {
    phase.value = 'Crashed'
    currentMultiplier.value = payload.crashMultiplier
    lastRevealedSeed.value = payload.serverSeed
    lastCrashPoints.value = [payload.crashMultiplier, ...lastCrashPoints.value].slice(0, 10)
  }

  function onBetConfirmed(payload: { betId: string; amount: number; autoCashoutTarget?: number | null }) {
    myBetAmount.value = payload.amount
    myBetStatus.value = 'Placed'
    myAutoCashoutTarget.value = payload.autoCashoutTarget ?? null
    betRejectionReason.value = null
  }

  function onBetRejected(payload: { message: string }) {
    myBetStatus.value = 'Rejected'
    betRejectionReason.value = payload.message
  }

  function onBetPlacedByPlayer(payload: {
    playerId: string
    username: string
    displayedAchievementKey?: string | null
    amount: number
  }) {
    roundBets.value = [
      ...roundBets.value,
      {
        playerId: payload.playerId,
        username: payload.username,
        displayedAchievementKey: payload.displayedAchievementKey ?? null,
        amount: payload.amount,
        kind: 'bet',
      },
    ]
  }

  function onPlayerCashedOut(payload: {
    playerId: string
    username: string
    displayedAchievementKey?: string | null
    cashOutMultiplier: number
    payout: number
  }) {
    roundBets.value = [
      ...roundBets.value,
      {
        playerId: payload.playerId,
        username: payload.username,
        displayedAchievementKey: payload.displayedAchievementKey ?? null,
        amount: payload.payout,
        kind: 'cashout',
        cashOutMultiplier: payload.cashOutMultiplier,
      },
    ]
  }

  function onCashOutConfirmed(payload: { cashOutMultiplier: number; payout: number; auto?: boolean }) {
    cashOutStatus.value = 'CashedOut'
    cashOutResult.value = {
      cashOutMultiplier: payload.cashOutMultiplier,
      payout: payload.payout,
      auto: payload.auto ?? false,
    }
    myBetStatus.value = 'None' // the bet is resolved now — no longer an active "placed" bet
  }

  function onCashOutRejected(payload: { message: string }) {
    cashOutStatus.value = 'Rejected'
    cashOutRejectionReason.value = payload.message
  }

  return {
    roundId,
    roundNumber,
    phase,
    serverSeedHash,
    currentMultiplier,
    countdownSeconds,
    lastCrashPoints,
    lastRevealedSeed,
    myBetAmount,
    myBetStatus,
    myAutoCashoutTarget,
    betRejectionReason,
    roundBets,
    cashOutStatus,
    cashOutResult,
    cashOutRejectionReason,
    onCashOutConfirmed,
    onCashOutRejected,
    applySnapshot,
    onRoundWaiting,
    onRoundStarted,
    onMultiplierTick,
    onRoundCrashed,
    onBetConfirmed,
    onBetRejected,
    onBetPlacedByPlayer,
    onPlayerCashedOut,
  }
})
