import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as rtpService from '@/services/rtpService'
import type { RtpSummary } from '@/types'

export const useRtpStore = defineStore('rtp', () => {
  const summary = ref<RtpSummary | null>(null)
  const isLoading = ref(false)

  async function fetchSummary() {
    isLoading.value = true
    try {
      summary.value = await rtpService.getRtpSummary()
    } finally {
      isLoading.value = false
    }
  }

  return { summary, isLoading, fetchSummary }
})
