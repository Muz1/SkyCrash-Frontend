import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as adminService from '@/services/adminService'
import type { AdminPlayerSummary } from '@/types'

export const useAdminStore = defineStore('admin', () => {
  const players = ref<AdminPlayerSummary[]>([])
  const isLoading = ref(false)
  const searchTerm = ref('')
  const blockedFilter = ref<'all' | 'blocked' | 'active'>('all')
  const adminFilter = ref<'all' | 'admin' | 'player'>('all')
  const sortBy = ref<'username' | 'email' | 'balance' | 'membersince' | 'lastseen'>('username')
  const sortDir = ref<'asc' | 'desc'>('asc')

  async function fetchPlayers() {
    isLoading.value = true
    try {
      players.value = await adminService.getPlayers({
        search: searchTerm.value || undefined,
        isBlocked: blockedFilter.value === 'all' ? undefined : blockedFilter.value === 'blocked',
        isAdmin: adminFilter.value === 'all' ? undefined : adminFilter.value === 'admin',
        sortBy: sortBy.value,
        sortDir: sortDir.value,
      })
    } finally {
      isLoading.value = false
    }
  }

  function toggleSortDir() {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  }

  async function promote(playerId: string) {
    await adminService.promotePlayer(playerId)
    await fetchPlayers()
  }

  async function demote(playerId: string) {
    await adminService.demotePlayer(playerId)
    await fetchPlayers()
  }

  async function block(playerId: string) {
    await adminService.blockPlayer(playerId)
    await fetchPlayers()
  }

  async function unblock(playerId: string) {
    await adminService.unblockPlayer(playerId)
    await fetchPlayers()
  }

  async function adjustBalance(playerId: string, amount: number, reason: string) {
    await adminService.adjustBalance(playerId, amount, reason)
    await fetchPlayers()
  }

  return {
    players,
    isLoading,
    searchTerm,
    blockedFilter,
    adminFilter,
    sortBy,
    sortDir,
    toggleSortDir,
    fetchPlayers,
    promote,
    demote,
    block,
    unblock,
    adjustBalance,
  }
})
