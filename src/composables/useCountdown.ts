import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'

/**
 * Live seconds remaining until `target` (an ISO date string), ticking once a second.
 * Used for the daily-challenge reset timer and the spin-wheel cooldown.
 */
export function useCountdown(target: Ref<string | null | undefined>) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null

  const seconds = computed(() => {
    if (!target.value) return 0
    return Math.max(0, Math.ceil((new Date(target.value).getTime() - now.value) / 1000))
  })

  function start() {
    stop()
    now.value = Date.now()
    timer = setInterval(() => {
      now.value = Date.now()
      if (seconds.value === 0) stop()
    }, 1000)
  }
  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }

  watch(target, (t) => (t ? start() : stop()), { immediate: true })
  onBeforeUnmount(stop)

  return { seconds }
}

/** 5h 03m · 4m 09s · 37s */
export function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}
