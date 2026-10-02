import { computed, onMounted, ref, watch } from 'vue'
import { useChallengeStore } from '@/stores/challengeStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useAuthStore } from '@/stores/AuthStore'
import { useGameStore } from '@/stores/gameStore'
import { BET_STEPS } from '@/lib/betSteps'

function readKey(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function writeKey(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage blocked: the briefing just shows again next visit.
  }
}

/**
 * The game screen's two prompts:
 *  - Today's Challenges notification bar along the top, until dismissed for the day.
 *  - The free-credits wheel, whenever the balance can't cover the smallest bet.
 * The bar never blocks play; the out-of-credits notice does (it pauses the feedback prompt).
 */
export function useGameScreenPrompts() {
  const challengeStore = useChallengeStore()
  const playerStore = usePlayerStore()
  const authStore = useAuthStore()
  const gameStore = useGameStore()

  const briefingOpen = ref(false)
  const wheelOpen = ref(false)
  // Closing the wheel snoozes the automatic prompt until credits recover and run out again.
  const wheelDismissed = ref(false)

  const minBet = BET_STEPS[0]
  const outOfCredits = computed(
    () => !!playerStore.profile && !playerStore.profile.isAdmin && playerStore.profile.creditBalance < minBet,
  )
  // The challenge bar doesn't block anything; only the out-of-credits notice does.
  const anyOpen = computed(() => wheelOpen.value)

  const briefingKey = () => `skycrash_daily_brief_${authStore.playerId ?? 'anon'}`
  const todayUtc = () => new Date().toISOString().slice(0, 10)

  function maybeOpenWheel() {
    // A bet still in the air might pay out, so wait for it to resolve.
    if (outOfCredits.value && !wheelDismissed.value && gameStore.myBetStatus !== 'Placed') {
      wheelOpen.value = true
    }
  }

  function openWheel() {
    wheelOpen.value = true
  }

  function closeWheel() {
    wheelOpen.value = false
    if (outOfCredits.value) wheelDismissed.value = true
  }

  function closeBriefing() {
    briefingOpen.value = false
    writeKey(briefingKey(), todayUtc())
  }

  watch(outOfCredits, (out) => {
    if (!out) wheelDismissed.value = false
    else maybeOpenWheel()
  })
  watch(() => gameStore.myBetStatus, maybeOpenWheel)

  onMounted(async () => {
    if (!playerStore.profile) await playerStore.fetchProfile().catch(() => undefined)
    if (playerStore.profile?.isAdmin) return

    maybeOpenWheel()

    try {
      await challengeStore.fetchTodayChallenges()
    } catch {
      return
    }
    if (readKey(briefingKey()) !== todayUtc() && challengeStore.challenges.length > 0) {
      briefingOpen.value = true
    }
  })

  return { briefingOpen, wheelOpen, outOfCredits, anyOpen, openWheel, closeWheel, closeBriefing }
}
