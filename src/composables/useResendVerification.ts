import { ref } from 'vue'
import * as authService from '@/services/AuthService'
import { apiError } from '@/lib/apiError'
import { usePlayerStore } from '@/stores/playerStore'
import { en } from '@/copy/en'

/**
 * "Verify email" → Resend: sends a fresh link. 409 means the email is already verified
 * (the profile is refreshed so the banner goes), 429 means the hourly limit was hit.
 */
export function useResendVerification() {
  const sending = ref(false)
  const message = ref<string | null>(null)
  const ok = ref(false)

  async function resend() {
    if (sending.value) return
    sending.value = true
    message.value = null
    try {
      await authService.resendVerification()
      ok.value = true
      message.value = en.verifyEmail.sent
    } catch (err) {
      const { status } = apiError(err)
      ok.value = status === 409
      message.value = status === 429 ? en.verifyEmail.tooMany : status === 409 ? en.verifyEmail.already : en.common.tryAgain
      if (status === 409) void usePlayerStore().fetchProfile().catch(() => undefined)
    } finally {
      sending.value = false
    }
  }

  return { resend, sending, message, ok }
}
