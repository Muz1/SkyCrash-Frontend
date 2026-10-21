import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as responsiblePlayService from '@/services/responsiblePlayService'
import { useGameStore } from '@/stores/gameStore'
import type { PlaySession } from '@/types'

/** The last reminder shown, so a remount (or reload) doesn't show the same one twice. */
const SHOWN_KEY = 'skycrash_reality_check_at'

function shownAt(): number {
  try {
    return Number(sessionStorage.getItem(SHOWN_KEY) ?? 0)
  } catch {
    return 0
  }
}
function markShown(minute: number) {
  try {
    sessionStorage.setItem(SHOWN_KEY, String(minute))
  } catch {
    // Non-fatal.
  }
}

/**
 * Responsible play: every `reminderMinutes` of a session (GET /api/responsible-play/session)
 * a small reality check shows time played and the session's net result. It waits until the
 * player has no bet in the air, so it never covers the Cash Out button mid-flight.
 */
export function useRealityCheck() {
  const gameStore = useGameStore()
  const session = ref<PlaySession | null>(null)
  const due = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  const busy = computed(() => gameStore.myBetStatus === 'Placed' && gameStore.phase === 'Running')
  const isOpen = computed(() => due.value && !busy.value && !!session.value)

  function schedule(s: PlaySession) {
    if (timer) clearTimeout(timer)
    if (!(s.reminderMinutes > 0)) return
    const next = (Math.floor(s.minutesPlayed / s.reminderMinutes) + 1) * s.reminderMinutes
    const waitMs = Math.max(5_000, (next - s.minutesPlayed) * 60_000)
    timer = setTimeout(() => void check(next), waitMs)
  }

  async function check(minute?: number) {
    try {
      const s = await responsiblePlayService.getSession()
      session.value = s
      // On first load too: someone back after 45 minutes of play sees the 30-minute check now.
      const mark = minute ?? Math.floor(s.minutesPlayed / Math.max(1, s.reminderMinutes)) * s.reminderMinutes
      if (s.reminderMinutes > 0 && mark > 0 && s.minutesPlayed >= mark && shownAt() < mark) {
        due.value = true
        markShown(mark)
      }
      schedule(s)
    } catch {
      // Older server or signed out: no reminders.
    }
  }

  function close() {
    due.value = false
  }

  onMounted(() => void check())
  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })
  // Keep the numbers fresh when it finally opens after a flight.
  watch(isOpen, (open) => {
    if (open) void responsiblePlayService.getSession().then((s) => (session.value = s)).catch(() => undefined)
  })

  return { session, isOpen, close }
}
