import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as walletService from '@/services/walletService'
import { usePlayerStore } from '@/stores/playerStore'
import type { CreditTransactionRecord } from '@/types'

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
  return 'Top-up failed.'
}

export const useWalletStore = defineStore('wallet', () => {
  const transactions = ref<CreditTransactionRecord[]>([])
  const isLoading = ref(false)
  const errorMessage = ref('')

  async function fetchTransactions() {
    isLoading.value = true
    try {
      transactions.value = await walletService.getTransactions()
    } finally {
      isLoading.value = false
    }
  }

  async function requestDemoTopUp() {
  errorMessage.value = ''
  try {
    await walletService.demoTopUp()
    // The nav bar and any other balance display read from playerStore,
    // so refresh it here to keep everything in sync after a balance change.
    const playerStore = usePlayerStore()
    await playerStore.fetchProfile()
    await fetchTransactions()
  } catch (err: unknown) {
    errorMessage.value = extractErrorMessage(err)
    throw err
  }
}

  return { transactions, isLoading, errorMessage, fetchTransactions, requestDemoTopUp }
})