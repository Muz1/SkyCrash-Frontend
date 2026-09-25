import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as paymentService from '@/services/paymentService'
import { usePlayerStore } from '@/stores/playerStore'
import { useWalletStore } from '@/stores/walletStore'
import type { CreditPack } from '@/types'

// Balance just before leaving for PayFast, so on return we can tell whether the
// credits have landed - even if PayFast's ITN arrived before the redirect did.
const PRE_CHECKOUT_BALANCE_KEY = 'skycrash.preCheckoutBalance'

function extractErrorMessage(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: unknown }).response === 'object'
  ) {
    const response = (err as { response?: { data?: { message?: unknown } } }).response
    if (response && typeof response.data?.message === 'string') {
      return response.data.message
    }
  }
  return 'Purchase failed. Please try again.'
}

function readPreCheckoutBalance(): number | null {
  try {
    const raw = sessionStorage.getItem(PRE_CHECKOUT_BALANCE_KEY)
    sessionStorage.removeItem(PRE_CHECKOUT_BALANCE_KEY)
    const value = raw === null ? NaN : Number(raw)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

function writePreCheckoutBalance(balance: number | undefined) {
  if (balance === undefined) return
  try {
    sessionStorage.setItem(PRE_CHECKOUT_BALANCE_KEY, String(balance))
  } catch {
    // Storage unavailable (private mode etc.) - we fall back to polling for a change.
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const usePaymentStore = defineStore('payment', () => {
  const packs = ref<CreditPack[]>([])
  const isLoadingPacks = ref(false)
  const packsError = ref('')
  const isRedirecting = ref(false)
  const errorMessage = ref('')

  async function fetchPacks() {
    isLoadingPacks.value = true
    packsError.value = ''
    try {
      packs.value = await paymentService.getPacks()
    } catch {
      packs.value = []
      packsError.value = 'Could not load credit packs.'
    } finally {
      isLoadingPacks.value = false
    }
  }

  /**
   * PayFast is a hosted checkout: there's no in-page "confirm payment" step.
   * We ask the backend for a signed set of form fields, then build and submit
   * a real HTML form so the browser navigates to PayFast's payment page.
   * Failures are surfaced through errorMessage rather than thrown.
   */
  async function redirectToCheckout(packId: string) {
    if (isRedirecting.value) return
    errorMessage.value = ''
    isRedirecting.value = true
    try {
      const checkout = await paymentService.createCheckout(packId)
      writePreCheckoutBalance(usePlayerStore().profile?.creditBalance)

      const form = document.createElement('form')
      form.method = 'POST'
      form.action = checkout.actionUrl

      for (const [key, value] of Object.entries(checkout.fields)) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      }

      document.body.appendChild(form)
      form.submit()
      // Browser is navigating away now; no need to reset isRedirecting.
    } catch (err: unknown) {
      errorMessage.value = extractErrorMessage(err)
      isRedirecting.value = false
    }
  }

  /**
   * Credits are only granted by the backend once PayFast's ITN (webhook)
   * confirms the payment completed - that happens server-to-server, usually
   * around the same time the browser is redirected back here. Poll the balance
   * briefly so the UI updates as soon as it lands.
   *
   * Resolves true once the balance has gone up, false if it hasn't yet.
   */
  async function refreshBalanceAfterPurchase(): Promise<boolean> {
    const playerStore = usePlayerStore()
    const walletStore = useWalletStore()

    let startingBalance = readPreCheckoutBalance()
    if (startingBalance === null) {
      // No stored baseline: use the balance as of now and wait for it to change.
      await playerStore.fetchProfile().catch(() => undefined)
      startingBalance = playerStore.profile?.creditBalance ?? 0
    }

    let credited = false
    for (let attempt = 0; attempt < 15; attempt++) {
      if (attempt > 0) await delay(2000)
      try {
        await playerStore.fetchProfile()
      } catch {
        continue
      }
      if ((playerStore.profile?.creditBalance ?? 0) > startingBalance) {
        credited = true
        break
      }
    }

    await walletStore.fetchTransactions().catch(() => undefined)
    return credited
  }

  return {
    packs,
    isLoadingPacks,
    packsError,
    isRedirecting,
    errorMessage,
    fetchPacks,
    redirectToCheckout,
    refreshBalanceAfterPurchase,
  }
})
