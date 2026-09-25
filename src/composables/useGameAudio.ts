import { onBeforeUnmount, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { soundEngine } from '@/lib/soundEngine'

/**
 * Plays the round's sound effects (countdown, take-off, engine, cash-out,
 * crash) while the game screen is open. Effects duck the background music
 * automatically inside soundEngine.
 */
export function useGameAudio() {
  const gameStore = useGameStore()

  watch(
    () => gameStore.phase,
    (phase, previous) => {
      if (phase === 'Running') {
        soundEngine.takeoff()
      } else if (phase === 'Crashed') {
        // Only boom for a crash we actually watched, not a snapshot on page load.
        if (previous === 'Running') soundEngine.crash()
        else soundEngine.stopEngine()
      } else {
        soundEngine.stopEngine()
      }
    },
  )

  watch(
    () => gameStore.currentMultiplier,
    (m) => {
      if (gameStore.phase !== 'Running') return
      soundEngine.updateEngine(m)
    },
  )

  watch(
    () => gameStore.countdownSeconds,
    (s, prev) => {
      if (gameStore.phase === 'Waiting' && s !== null && prev !== null && s < prev && s <= 3 && s >= 1) {
        soundEngine.countdownTick(s === 1)
      }
    },
  )

  watch(
    () => gameStore.myBetStatus,
    (status) => {
      if (status === 'Placed') soundEngine.betPlaced()
    },
  )

  watch(
    () => gameStore.cashOutStatus,
    (status) => {
      if (status === 'CashedOut') soundEngine.cashOut()
    },
  )

  onBeforeUnmount(() => {
    soundEngine.stopEngine()
  })
}
