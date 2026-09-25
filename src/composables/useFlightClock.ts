import { onBeforeUnmount, ref, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'

/**
 * Must match the backend's GameEngineConstants.MultiplierGrowthRate: the
 * server computes multiplier = e^(GROWTH · elapsedSeconds) and ticks it out
 * every 100ms, rounded to 2dp.
 */
export const GROWTH = 0.06

/** Never display more than this far past the last server tick (seconds of growth). */
const MAX_LEAD_S = 0.18

export const multiplierAt = (seconds: number) => Math.exp(GROWTH * seconds)
export const secondsAt = (multiplier: number) => Math.log(Math.max(1, multiplier)) / GROWTH

/**
 * Smooth, frame-rate multiplier for rendering. The server only sends a value
 * every 100ms, so between ticks we extrapolate along the same exponential
 * curve from an estimate of when the round started (locally), capped so the
 * display can never run meaningfully ahead of what the server has confirmed —
 * important because the crash can land on any tick.
 */
export function useFlightClock() {
  const gameStore = useGameStore()

  const multiplier = ref(gameStore.currentMultiplier)
  const elapsed = ref(secondsAt(gameStore.currentMultiplier))

  let startMs: number | null = null
  let frame: number | null = null

  function sampleStart(serverMultiplier: number) {
    // Tick values are rounded to 2dp; using the low end of that rounding
    // window means our start estimate errs late, never early.
    const conservative = Math.max(1, serverMultiplier - 0.005)
    const candidate = performance.now() - secondsAt(conservative) * 1000
    // The least-delayed tick gives the best estimate of the real start.
    startMs = startMs === null ? candidate : Math.min(startMs, candidate)
  }

  function render() {
    const server = gameStore.currentMultiplier
    let next = server
    if (startMs !== null) {
      const predicted = multiplierAt((performance.now() - startMs) / 1000)
      next = Math.min(predicted, server * multiplierAt(MAX_LEAD_S))
    }
    // Monotonic: the display never rolls backwards within a round.
    next = Math.max(next, server, multiplier.value)
    multiplier.value = next
    elapsed.value = secondsAt(next)
  }

  function loop() {
    render()
    frame = requestAnimationFrame(loop)
  }

  function stopLoop() {
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null
  }

  watch(
    () => gameStore.phase,
    (phase) => {
      stopLoop()
      if (phase === 'Running') {
        startMs = null
        multiplier.value = gameStore.currentMultiplier
        sampleStart(gameStore.currentMultiplier)
        loop()
      } else {
        // Waiting/Crashed/Idle: show exactly what the server says (the crash value).
        multiplier.value = gameStore.currentMultiplier
        elapsed.value = secondsAt(gameStore.currentMultiplier)
      }
    },
    { immediate: true },
  )

  watch(
    () => gameStore.currentMultiplier,
    (value) => {
      if (gameStore.phase === 'Running') {
        sampleStart(value)
      } else {
        multiplier.value = value
        elapsed.value = secondsAt(value)
      }
    },
  )

  onBeforeUnmount(stopLoop)

  return { multiplier, elapsed }
}
