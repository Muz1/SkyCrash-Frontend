import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/playerStore'
import * as playerService from '@/services/playerService'

/**
 * The first-flight tutorial on the game screen. It opens by itself the first time a player
 * reaches /game (tracked on their account, so once per player rather than per browser), and
 * can be replayed any time from the "?" button or /game?tutorial=1.
 */
export function useTutorial() {
  const playerStore = usePlayerStore()
  const route = useRoute()
  const router = useRouter()
  const isOpen = ref(false)

  function open() {
    isOpen.value = true
  }

  async function finish() {
    isOpen.value = false
    if (route.query.tutorial)
      void router.replace({ query: { ...route.query, tutorial: undefined } })
    const profile = playerStore.profile
    if (profile && profile.hasCompletedTutorial === false) {
      profile.hasCompletedTutorial = true
      await playerService.completeTutorial().catch(() => undefined)
    }
  }

  function maybeAutoOpen() {
    const profile = playerStore.profile
    if (
      route.query.tutorial === '1' ||
      (profile && !profile.isAdmin && profile.hasCompletedTutorial === false)
    ) {
      isOpen.value = true
    }
  }

  onMounted(maybeAutoOpen)
  watch(() => playerStore.profile?.playerId, maybeAutoOpen)

  return { isOpen, open, finish }
}
