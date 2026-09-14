import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as adminService from '@/services/adminService'
import type { AdminPlayerSummary } from '@/types'

export const useAdminStore = defineStore('admin', () => {
  const players = ref<AdminPlayerSummary[]>([])
  const isLoading = ref(false)
  const searchTerm = ref('')

  async function fetchPlayers() {
    isLoading.value = true
    try {
      players.value = await adminService.getPlayers(searchTerm.value || undefined)
    } finally {
      isLoading.value = false
    }
  }

  async function promote(playerId: string) {
    await adminService.promotePlayer(playerId)
    await fetchPlayers()
  }

  async function demote(playerId: string) {
    await adminService.demotePlayer(playerId)
    await fetchPlayers()
  }

  async function adjustBalance(playerId: string, amount: number, reason: string) {
    await adminService.adjustBalance(playerId, amount, reason)
    await fetchPlayers()
  }

  return { players, isLoading, searchTerm, fetchPlayers, promote, demote, adjustBalance }
})
