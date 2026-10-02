import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as walletService from '@/services/walletService'
import type { CreditTransactionRecord } from '@/types'

// Transaction history for the wallet page. Free credits come from the spin wheel
// (SpinWheelPanel / walletService.spinWheel); the old demo top-up was retired.
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

  return { transactions, isLoading, errorMessage, fetchTransactions }
})
