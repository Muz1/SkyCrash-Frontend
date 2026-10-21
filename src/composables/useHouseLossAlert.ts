import { ref } from 'vue'
import { getConnection } from '@/services/signalr'
import type { HouseLossLimitReachedPayload } from '@/types/admin'

// The daily loss circuit breaker alert. The server sends HouseLossLimitReached to every admin
// when today's NGR drops below −limit (new bets pause); the admin shell shows a banner until
// dismissed. Module-level so it survives navigating between admin pages.
const alert = ref<HouseLossLimitReachedPayload | null>(null)

function onReached(payload: HouseLossLimitReachedPayload) {
  alert.value = payload
}

export function useHouseLossAlert() {
  /** (Re)attaches the listener to the current hub connection; safe to call on every mount. */
  function listen() {
    try {
      const connection = getConnection()
      connection.off('HouseLossLimitReached', onReached)
      connection.on('HouseLossLimitReached', onReached)
    } catch {
      // No hub in this environment (tests); the Health page still shows the status.
    }
  }
  return {
    alert,
    listen,
    dismiss: () => (alert.value = null),
    raise: (payload: HouseLossLimitReachedPayload) => (alert.value = payload),
  }
}
