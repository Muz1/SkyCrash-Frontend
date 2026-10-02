import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useAuthStore } from '@/stores/AuthStore'
import * as feedbackService from '@/services/feedbackService'
import type { SubmitFeedbackResult } from '@/types/insights'
import type { FeedbackSubmission, PlayerFeedbackStatus } from '@/types/feedback'

// Let the crash animation and result land before the box slides in.
const AFTER_CRASH_DELAY_MS = 2500
/** A cash-out at or above this multiplier counts as a big win and earns its own ask. */
const BIG_WIN_MULTIPLIER = 5

/** ask = the yes/no box, form = the questions, done = the thank-you / reward screen. */
export type FeedbackStage = 'ask' | 'form' | 'done'

interface Snooze {
  /** roundsPlayed when the player said "no". */
  rounds: number
  /** The cash-out target that was due at the time; a new target ends the snooze. */
  target: number | null
}

function snoozeKey(playerId: string | null) {
  return `skycrash_feedback_snooze_${playerId ?? 'anon'}`
}

function readSnooze(playerId: string | null): Snooze | null {
  try {
    const raw = localStorage.getItem(snoozeKey(playerId))
    if (raw === null) return null
    const parsed = JSON.parse(raw) as Snooze | number
    // Older saves stored just the round count.
    return typeof parsed === 'number' ? { rounds: parsed, target: null } : parsed
  } catch {
    return null
  }
}

function writeSnooze(playerId: string | null, snooze: Snooze) {
  try {
    localStorage.setItem(snoozeKey(playerId), JSON.stringify(snooze))
  } catch {
    // Storage unavailable (private mode etc.) — the prompt just comes back sooner.
  }
}

/** Whether sending feedback right now earns credits (older servers: whenever it's due). */
export function rewardIsAvailable(s: PlayerFeedbackStatus | null) {
  if (!s) return false
  return (s.rewardAvailable ?? s.isDue) && s.rewardCredits > 0
}

/**
 * State for the feedback dialog wherever it's shown: which stage it's on, the
 * player's reward status, submitting, and the result for the thank-you screen.
 * The game screen drives it through useFeedbackPrompt; the home page opens the
 * form directly from its "Give us feedback" button.
 */
export function useFeedbackForm() {
  const playerStore = usePlayerStore()
  const authStore = useAuthStore()

  const isOpen = ref(false)
  const stage = ref<FeedbackStage>('ask')
  const status = ref<PlayerFeedbackStatus | null>(null)
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const result = ref<SubmitFeedbackResult | null>(null)

  const rewardAvailable = computed(() => rewardIsAvailable(status.value))
  const rewardCredits = computed(() => status.value?.rewardCredits ?? 0)

  async function refreshStatus() {
    try {
      status.value = await feedbackService.getFeedbackStatus()
    } catch {
      // Best-effort: without a status the dialog just doesn't promise credits.
    }
    return status.value
  }

  function open(startAt: 'ask' | 'form') {
    error.value = null
    result.value = null
    stage.value = startAt
    isOpen.value = true
  }

  /** Opened by the player (e.g. the home page button): straight to the questions. */
  function openForm() {
    open('form')
    void refreshStatus()
  }

  function accept() {
    stage.value = 'form'
  }

  /** "No" / "Maybe later" / Escape: close, and snooze the automatic ask for a while. */
  function dismiss() {
    const s = status.value
    if (s) writeSnooze(authStore.playerId, { rounds: s.roundsPlayed, target: s.nextPromptAtCashOut ?? null })
    isOpen.value = false
  }

  /** Leaves the thank-you screen. */
  function close() {
    isOpen.value = false
    result.value = null
  }

  async function submit(payload: FeedbackSubmission) {
    submitting.value = true
    error.value = null
    try {
      result.value = await feedbackService.submitFeedback(payload)
      stage.value = 'done'
      // The reward (if any) has been paid: refresh the balance and the schedule.
      void playerStore.fetchProfile()
      void refreshStatus()
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined
      error.value = message ?? 'Could not send your feedback. Please try again.'
    } finally {
      submitting.value = false
    }
  }

  return {
    isOpen,
    stage,
    status,
    submitting,
    error,
    result,
    rewardAvailable,
    rewardCredits,
    refreshStatus,
    open,
    openForm,
    accept,
    dismiss,
    close,
    submit,
  }
}

/**
 * The feedback retention loop on the game screen. After each round ends it asks
 * the backend whether feedback is due (decided server-side from the player's
 * cash-outs, with the gap growing after each answer), and it also asks once
 * after a big win (a cash-out at 5x or more) even when nothing is due. It never
 * interrupts a flight and yields to other pop-ups. "No" snoozes the regular ask.
 */
export function useFeedbackPrompt(options: { isBlocked?: () => boolean } = {}) {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const authStore = useAuthStore()
  const form = useFeedbackForm()

  let timer: ReturnType<typeof setTimeout> | null = null
  let checking = false
  /** Round of the player's latest big win, and the round we last asked about one. */
  let bigWinRound: string | null = null
  let bigWinAskedRound: string | null = null

  // A function (not an inline comparison) so the re-check after the network call
  // isn't narrowed away: the round may have taken off while we were waiting.
  const inFlight = () => gameStore.phase === 'Running'

  function isSnoozed(s: PlayerFeedbackStatus) {
    const snooze = readSnooze(authStore.playerId)
    if (!snooze) return false
    // A new due target (e.g. after answering elsewhere) means a fresh ask.
    if (snooze.target !== null && s.nextPromptAtCashOut !== undefined && snooze.target !== s.nextPromptAtCashOut) return false
    return s.roundsPlayed < snooze.rounds + Math.max(1, s.intervalRounds)
  }

  async function check() {
    if (checking || form.isOpen.value || playerStore.profile?.isAdmin) return
    // Another pop-up (daily briefing, credits wheel) is up: try again after the next round.
    if (options.isBlocked?.()) return
    // Never cover the screen while the plane is in the air.
    if (inFlight()) return
    checking = true
    try {
      const s = await form.refreshStatus()
      const bigWin = bigWinRound !== null && bigWinRound !== bigWinAskedRound
      const due = !!s && s.isDue && !isSnoozed(s)
      if ((bigWin || due) && !inFlight() && !options.isBlocked?.() && !form.isOpen.value) {
        if (bigWin) bigWinAskedRound = bigWinRound
        form.open('ask')
      }
    } finally {
      checking = false
    }
  }

  function scheduleCheck(delay: number) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(check, delay)
  }

  // Remember a big win of our own; the ask waits until the round has ended.
  watch(
    () => gameStore.cashOutResult,
    (r) => {
      if (r && gameStore.cashOutStatus === 'CashedOut' && r.cashOutMultiplier >= BIG_WIN_MULTIPLIER) {
        bigWinRound = gameStore.roundId ?? 'unknown'
      }
    },
  )

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

  return form
}
