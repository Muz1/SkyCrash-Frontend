import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as volatilityService from '@/services/volatilityService'
import type { VolatilitySummary } from '@/types'

export const useVolatilityStore = defineStore('volatility', () => {
  const summary = ref<VolatilitySummary | null>(null)
  const isLoading = ref(false)

  async function fetchSummary() {
    isLoading.value = true
    try {
      summary.value = await volatilityService.getSummary()
    } finally {
      isLoading.value = false
    }
  }

  return { summary, isLoading, fetchSummary }
})
