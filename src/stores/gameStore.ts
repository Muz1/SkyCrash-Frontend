import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CashOutReason, LiveRoundBet, LobbyRoundBet } from '@/types'

/** A lobby-mate's bet this round, kept up to date by the bet/cash-out broadcasts. */
export interface LobbyBet {
  amount: number
  craftId: string | null
  status: 'Placed' | 'CashedOut'
  cashOutMultiplier: number | null
}

export type RoundPhase = 'Idle' | 'Waiting' | 'Running' | 'Crashed'

/** The summary card after one of my cash-outs: stays up (dismissable) into the next round. */
export interface WinSummary {
  roundId: string | null
  roundNumber: number | null
  stake: number
  multiplier: number
  payout: number
  auto: boolean
  reason: CashOutReason | null
  /** Filled in once the round ends. */
  crashMultiplier: number | null
  maxReached: boolean
}

/** One row of the public live-bets panel. */
export interface LiveBetRow {
  username: string
  amount: number
  status: 'Placed' | 'CashedOut' | 'Lost'
  cashOutMultiplier: number | null
  payout: number | null
}

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
  /** One entry per lobby-mate who bet this round, keyed by player id. Only lobby-mates are ever sent. */
  const lobbyBets = ref<Record<string, LobbyBet>>({})
  const cashOutStatus = ref<'None' | 'CashedOut' | 'Rejected'>('None')
  const cashOutResult = ref<{
    cashOutMultiplier: number
    payout: number
    auto: boolean
    reason?: CashOutReason | null
  } | null>(null)
  const cashOutRejectionReason = ref<string | null>(null)
  /** The round ended at the cap instead of crashing: everyone still flying was paid. */
  const maxReached = ref(false)
  /** Round limits announced with RoundWaiting (older servers omit them). */
  const roundMaxMultiplier = ref<number | null>(null)
  /** Machine-readable reason for the last refused bet (restricted / rules-required / loss-limit). */
  const betRejectionCode = ref<string | null>(null)
  /** Did I have a live (not cashed-out) bet when the round ended? Drives the crash sound. */
  const hadLiveBetAtCrash = ref(false)
  const lastWin = ref<WinSummary | null>(null)
  /** Everyone's bets this round, usernames only (GetLiveRoundBets + LiveBet / LiveCashOut). */
  const liveBets = ref<LiveBetRow[]>([])

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
    maxMultiplier?: number
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
    lobbyBets.value = {}
    cashOutStatus.value = 'None'
    cashOutResult.value = null
    cashOutRejectionReason.value = null
    maxReached.value = false
    hadLiveBetAtCrash.value = false
    betRejectionCode.value = null
    liveBets.value = []
    if (typeof payload.maxMultiplier === 'number') roundMaxMultiplier.value = payload.maxMultiplier
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

  function onRoundCrashed(payload: { crashMultiplier: number; serverSeed: string; maxMultiplierReached?: boolean }) {
    hadLiveBetAtCrash.value = myBetStatus.value === 'Placed' && cashOutStatus.value !== 'CashedOut'
    maxReached.value = !!payload.maxMultiplierReached
    phase.value = 'Crashed'
    currentMultiplier.value = payload.crashMultiplier
    lastRevealedSeed.value = payload.serverSeed
    lastCrashPoints.value = [payload.crashMultiplier, ...lastCrashPoints.value].slice(0, 10)
    if (lastWin.value && lastWin.value.roundId === roundId.value) {
      lastWin.value = { ...lastWin.value, crashMultiplier: payload.crashMultiplier, maxReached: maxReached.value }
    }
    // Whoever is still on the board lost (at the cap the server sends their cash-outs instead).
    if (!maxReached.value) {
      liveBets.value = liveBets.value.map((b) => (b.status === 'Placed' ? { ...b, status: 'Lost' } : b))
    }
  }

  function onBetConfirmed(payload: { betId: string; amount: number; autoCashoutTarget?: number | null }) {
    myBetAmount.value = payload.amount
    myBetStatus.value = 'Placed'
    myAutoCashoutTarget.value = payload.autoCashoutTarget ?? null
    betRejectionReason.value = null
    betRejectionCode.value = null
    // A new bet replaces last round's win summary.
    lastWin.value = null
  }

  function onBetRejected(payload: { message: string; code?: string }) {
    myBetStatus.value = 'Rejected'
    betRejectionReason.value = payload.message
    betRejectionCode.value = payload.code ?? null
  }

  function onBetPlacedByPlayer(payload: {
    playerId: string
    username: string
    displayedAchievementKey?: string | null
    equippedCraftId?: string | null
    amount: number
  }) {
    lobbyBets.value = {
      ...lobbyBets.value,
      [payload.playerId]: { amount: payload.amount, craftId: payload.equippedCraftId ?? null, status: 'Placed', cashOutMultiplier: null },
    }
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
    const existing = lobbyBets.value[payload.playerId]
    lobbyBets.value = {
      ...lobbyBets.value,
      [payload.playerId]: {
        amount: existing?.amount ?? 0,
        craftId: existing?.craftId ?? null,
        status: 'CashedOut',
        cashOutMultiplier: payload.cashOutMultiplier,
      },
    }
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

  /** Replaces the lobby board with the server's view (after joining or reloading mid-round). */
  function applyLobbyRoundBets(forRoundId: string, bets: LobbyRoundBet[]) {
    if (forRoundId !== roundId.value) return
    const next: Record<string, LobbyBet> = {}
    for (const b of bets) {
      if (b.status === 'Lost') continue
      next[b.playerId] = { amount: b.amount, craftId: b.equippedCraftId, status: b.status, cashOutMultiplier: b.cashOutMultiplier }
    }
    lobbyBets.value = next
  }

  function onCashOutConfirmed(payload: {
    cashOutMultiplier: number
    payout: number
    auto?: boolean
    reason?: CashOutReason
  }) {
    cashOutStatus.value = 'CashedOut'
    cashOutResult.value = {
      cashOutMultiplier: payload.cashOutMultiplier,
      payout: payload.payout,
      auto: payload.auto ?? false,
      reason: payload.reason ?? null,
    }
    const stake = myBetAmount.value ?? payload.payout / Math.max(payload.cashOutMultiplier, 1)
    lastWin.value = {
      roundId: roundId.value,
      roundNumber: roundNumber.value,
      stake,
      multiplier: payload.cashOutMultiplier,
      payout: payload.payout,
      auto: payload.auto ?? false,
      reason: payload.reason ?? null,
      crashMultiplier: phase.value === 'Crashed' ? currentMultiplier.value : null,
      maxReached: phase.value === 'Crashed' && maxReached.value,
    }
    myBetStatus.value = 'None' // the bet is resolved now — no longer an active "placed" bet
  }

  function dismissWin() {
    lastWin.value = null
  }

  // ---------- public live-bets panel ----------

  function normaliseStatus(status: string): LiveBetRow['status'] {
    return status === 'CashedOut' ? 'CashedOut' : status === 'Lost' ? 'Lost' : 'Placed'
  }

  function applyLiveBets(bets: LiveRoundBet[]) {
    liveBets.value = bets.map((b) => ({
      username: b.username,
      amount: b.amount,
      status: normaliseStatus(b.status),
      cashOutMultiplier: b.cashOutMultiplier,
      payout: b.payout,
    }))
  }

  function onLiveBet(payload: { username: string; amount: number }) {
    const rest = liveBets.value.filter((b) => b.username !== payload.username)
    liveBets.value = [
      { username: payload.username, amount: payload.amount, status: 'Placed' as const, cashOutMultiplier: null, payout: null },
      ...rest,
    ].slice(0, 100)
  }

  function onLiveCashOut(payload: { username: string; cashOutMultiplier: number; payout: number }) {
    const existing = liveBets.value.find((b) => b.username === payload.username)
    const row: LiveBetRow = {
      username: payload.username,
      amount: existing?.amount ?? 0,
      status: 'CashedOut',
      cashOutMultiplier: payload.cashOutMultiplier,
      payout: payload.payout,
    }
    liveBets.value = existing
      ? liveBets.value.map((b) => (b.username === payload.username ? row : b))
      : [row, ...liveBets.value]
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
    lobbyBets,
    applyLobbyRoundBets,
    cashOutStatus,
    cashOutResult,
    cashOutRejectionReason,
    maxReached,
    roundMaxMultiplier,
    betRejectionCode,
    hadLiveBetAtCrash,
    lastWin,
    dismissWin,
    liveBets,
    applyLiveBets,
    onLiveBet,
    onLiveCashOut,
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
