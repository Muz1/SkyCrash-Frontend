import { onMounted, onUnmounted } from 'vue'
import * as lobbyService from '@/services/lobbyService'
import { useAuthStore } from '../stores/AuthStore'

const HEARTBEAT_INTERVAL_MS = 15_000

export function useHeartbeat() {
  const authStore = useAuthStore()
  let intervalId: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    if (!authStore.isAuthenticated) return

    lobbyService.sendHeartbeat().catch(() => {
      // A missed heartbeat isn't critical — the next interval tick will retry.
    })

    intervalId = setInterval(() => {
      if (authStore.isAuthenticated) {
        lobbyService.sendHeartbeat().catch(() => {})
      }
    }, HEARTBEAT_INTERVAL_MS)
  })

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
  })
}