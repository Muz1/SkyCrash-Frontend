import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as historyService from '@/services/historyService'
import type { RoundHistoryEntry, BetHistoryEntry } from '@/types'

export const useHistoryStore = defineStore('history', () => {
  const rounds = ref<RoundHistoryEntry[]>([])
  const bets = ref<BetHistoryEntry[]>([])
  const roundsPage = ref(1)
  const betsPage = ref(1)
  const isLoadingRounds = ref(false)
  const isLoadingBets = ref(false)

  async function fetchRounds(page = 1) {
    isLoadingRounds.value = true
    try {
      rounds.value = await historyService.getRoundHistory(page)
      roundsPage.value = page
    } finally {
      isLoadingRounds.value = false
    }
  }

  async function fetchBets(page = 1) {
    isLoadingBets.value = true
    try {
      bets.value = await historyService.getMyBetHistory(page)
      betsPage.value = page
    } finally {
      isLoadingBets.value = false
    }
  }

  return { rounds, bets, roundsPage, betsPage, isLoadingRounds, isLoadingBets, fetchRounds, fetchBets }
})
