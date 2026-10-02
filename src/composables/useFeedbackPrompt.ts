import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useAuthStore } from '@/stores/AuthStore'
import { useToastStore } from '@/stores/toastStore'
import * as feedbackService from '@/services/feedbackService'
import type { FeedbackStatus, SubmitFeedbackPayload } from '@/types/insights'

// Let the crash animation and result land before the form slides in.
const AFTER_CRASH_DELAY_MS = 2500

function snoozeKey(playerId: string | null) {
  return `skycrash_feedback_snooze_${playerId ?? 'anon'}`
}

function readSnooze(playerId: string | null): number | null {
  try {
    const raw = localStorage.getItem(snoozeKey(playerId))
    return raw === null ? null : Number(raw)
  } catch {
    return null
  }
}

function writeSnooze(playerId: string | null, roundsPlayed: number) {
  try {
    localStorage.setItem(snoozeKey(playerId), String(roundsPlayed))
  } catch {
    // Storage unavailable (private mode etc.) — the prompt just comes back sooner.
  }
}

/**
 * The feedback retention loop on the game screen. After each round ends it asks
 * the backend whether feedback is due (first after N rounds, then every M rounds,
 * both admin-configurable). It never interrupts a flight. "Not now" snoozes the
 * prompt for one interval; a submission is rewarded with free credits server-side.
 */
export function useFeedbackPrompt(options: { isBlocked?: () => boolean } = {}) {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const authStore = useAuthStore()
  const toastStore = useToastStore()

  const isOpen = ref(false)
  const status = ref<FeedbackStatus | null>(null)
  const submitting = ref(false)
  const error = ref<string | null>(null)

  let timer: ReturnType<typeof setTimeout> | null = null
  let checking = false

  // A function (not an inline comparison) so the re-check after the network call
  // isn't narrowed away: the round may have taken off while we were waiting.
  const inFlight = () => gameStore.phase === 'Running'

  function isSnoozed(s: FeedbackStatus) {
    const snoozedAt = readSnooze(authStore.playerId)
    return snoozedAt !== null && s.roundsPlayed < snoozedAt + s.intervalRounds && snoozedAt >= s.nextPromptAtRound
  }

  async function check() {
    if (checking || isOpen.value || playerStore.profile?.isAdmin) return
    // Another pop-up (daily briefing, credits wheel) is up: try again after the next round.
    if (options.isBlocked?.()) return
    // Never cover the screen while the plane is in the air.
    if (inFlight()) return
    checking = true
    try {
      const s = await feedbackService.getFeedbackStatus()
      status.value = s
      if (s.isDue && !isSnoozed(s) && !inFlight() && !options.isBlocked?.()) {
        error.value = null
        isOpen.value = true
      }
    } catch {
      // Status is best-effort; try again after the next round.
    } finally {
      checking = false
    }
  }

  function scheduleCheck(delay: number) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(check, delay)
  }

  function dismiss() {
    if (status.value) writeSnooze(authStore.playerId, status.value.roundsPlayed)
    isOpen.value = false
  }

  async function submit(payload: SubmitFeedbackPayload) {
    submitting.value = true
    error.value = null
    try {
      const result = await feedbackService.submitFeedback(payload)
      isOpen.value = false
      toastStore.push({
        title: 'Thanks, pilot!',
        message:
          result.creditsAwarded > 0
            ? `+${result.creditsAwarded} credits added to your balance.`
            : 'Your feedback was sent.',
        accent: 'lime',
      })
      await playerStore.fetchProfile()
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        // Already answered (e.g. in another tab): close quietly with the server's note.
        isOpen.value = false
        toastStore.push({ title: 'Feedback', message: message ?? 'Feedback already received.', accent: 'blue' })
      } else {
        error.value = message ?? 'Could not send your feedback. Please try again.'
      }
    } finally {
      submitting.value = false
    }
  }

  watch(
    () => gameStore.phase,
    (phase, previous) => {
      if (phase === 'Crashed' && previous === 'Running') scheduleCheck(AFTER_CRASH_DELAY_MS)
      // Lift-off while the timer is pending: wait for the next round instead.
      if (phase === 'Running' && timer) {
        clearTimeout(timer)
        timer = null
      }
    },
  )

  // Opening the game screen between rounds also counts (e.g. after a break).
  onMounted(() => scheduleCheck(1500))
  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return { isOpen, status, submitting, error, submit, dismiss }
}
