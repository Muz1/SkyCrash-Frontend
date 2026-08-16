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
  }

  function onRoundWaiting(payload: { roundId: string; roundNumber: number; serverSeedHash: string; countdownSeconds: number }) {
    roundId.value = payload.roundId
    roundNumber.value = payload.roundNumber
    serverSeedHash.value = payload.serverSeedHash
    countdownSeconds.value = payload.countdownSeconds
    currentMultiplier.value = 1.0
    phase.value = 'Waiting'
  }

  function onRoundStarted() {
    phase.value = 'Running'
    countdownSeconds.value = null
    currentMultiplier.value = 1.0
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

  return {
    roundId,
    roundNumber,
    phase,
    serverSeedHash,
    currentMultiplier,
    countdownSeconds,
    lastCrashPoints,
    lastRevealedSeed,
    applySnapshot,
    onRoundWaiting,
    onRoundStarted,
    onMultiplierTick,
    onRoundCrashed
  }
})
