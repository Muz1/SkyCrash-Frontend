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
  const verifiedFilter = ref<'all' | 'verified' | 'unverified'>('all')
  const testFilter = ref<'all' | 'test' | 'real'>('all')
  const sortBy = ref<'username' | 'email' | 'balance' | 'membersince' | 'lastseen'>('username')
  const sortDir = ref<'asc' | 'desc'>('asc')

  async function fetchPlayers() {
    isLoading.value = true
    try {
      players.value = await adminService.getPlayers({
        search: searchTerm.value || undefined,
        isBlocked: blockedFilter.value === 'all' ? undefined : blockedFilter.value === 'blocked',
        isAdmin: adminFilter.value === 'all' ? undefined : adminFilter.value === 'admin',
        emailVerified: verifiedFilter.value === 'all' ? undefined : verifiedFilter.value === 'verified',
        isTestAccount: testFilter.value === 'all' ? undefined : testFilter.value === 'test',
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

  async function block(playerId: string, body: { ruleCode: string; durationDays: number | null; internalNote?: string }) {
    await adminService.blockPlayer(playerId, body)
    await fetchPlayers()
  }

  async function unblock(playerId: string, reason?: string) {
    await adminService.unblockPlayer(playerId, reason)
    await fetchPlayers()
  }

  async function setTestAccount(playerId: string, isTestAccount: boolean) {
    await adminService.setTestAccount(playerId, isTestAccount)
    const p = players.value.find((x) => x.playerId === playerId)
    if (p) p.isTestAccount = isTestAccount
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
    verifiedFilter,
    testFilter,
    sortBy,
    sortDir,
    toggleSortDir,
    fetchPlayers,
    promote,
    demote,
    block,
    unblock,
    setTestAccount,
    adjustBalance,
  }
})
