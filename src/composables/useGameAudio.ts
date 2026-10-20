import { onBeforeUnmount, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { soundEngine } from '@/lib/soundEngine'

/**
 * Rounds that already played their one-shot cue. Module-level so a remounted
 * game screen, a duplicated SignalR handler or a reconnect snapshot can never
 * fire the same take-off / crash / win twice for one round.
 */
const played = { takeoff: null as string | null, crash: null as string | null, win: null as string | null }

/** Returns true the first time it's called for this cue + round. */
function once(cue: keyof typeof played, roundId: string | null) {
  const key = roundId ?? 'unknown'
  if (played[cue] === key) return false
  played[cue] = key
  return true
}

/**
 * Plays the round's sound effects (countdown, take-off, engine, cash-out,
 * crash) while the game screen is open. Effects duck the background music
 * automatically inside soundEngine, and the engine fades one big cue out
 * before starting the next.
 *
 * A player who cashed out never hears the "lost" crash: after a win the crash is a
 * soft "phew" (crashSafe), and a late
 * cash-out confirmation after the crash stays silent.
 */
export function useGameAudio() {
  const gameStore = useGameStore()

  watch(
    () => gameStore.phase,
    (phase, previous) => {
      if (phase === 'Running') {
        // Take-off only on the real Waiting → Running edge. Arriving mid-flight
        // (page load, reconnect snapshot) just spools up the engine drone.
        if (previous === 'Waiting' && once('takeoff', gameStore.roundId)) soundEngine.takeoff()
        else soundEngine.engineOn()
      } else if (phase === 'Crashed') {
        // Only for a crash we actually watched, not a snapshot on page load. Each ending has
        // its own cue: the cap fanfare, a soft "phew" after my cash-out, the full boom plus a
        // falling tone when my bet was still in, and the plain boom for spectators.
        const won = played.win === (gameStore.roundId ?? 'unknown')
        if (previous === 'Running' && once('crash', gameStore.roundId)) {
          if (gameStore.maxReached) soundEngine.maxReached()
          else if (won) soundEngine.crashSafe()
          else if (gameStore.hadLiveBetAtCrash) soundEngine.crashLost()
          else soundEngine.crash()
        } else soundEngine.landed()
      } else {
        soundEngine.landed()
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
      // Win chime: our own confirmed cash-out. The server only confirms before the
      // crash, but the events can arrive out of order, so a crash already heard wins.
      if (status !== 'CashedOut') return
      if (played.crash === (gameStore.roundId ?? 'unknown')) return
      if (once('win', gameStore.roundId)) soundEngine.cashOut()
    },
  )

  onBeforeUnmount(() => {
    soundEngine.landed()
  })
}
