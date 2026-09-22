import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as lobbyService from '@/services/lobbyService'
import type { LobbyDetails } from '@/types'

export const usePrivateLobbyStore = defineStore('privateLobby', () => {
  const lobby = ref<LobbyDetails | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  async function fetchMyLobby() {
    isLoading.value = true
    try {
      lobby.value = await lobbyService.getMyPrivateLobby()
    } finally {
      isLoading.value = false
    }
  }

  async function create(name: string) {
    errorMessage.value = null
    try {
      lobby.value = await lobbyService.createPrivateLobby(name)
    } catch (err) {
      errorMessage.value = extractMessage(err)
      throw err
    }
  }

  async function join(inviteCode: string) {
    errorMessage.value = null
    try {
      lobby.value = await lobbyService.joinPrivateLobby(inviteCode)
    } catch (err) {
      errorMessage.value = extractMessage(err)
      throw err
    }
  }

  async function leave() {
    errorMessage.value = null
    try {
      await lobbyService.leavePrivateLobby()
    } finally {
      lobby.value = null
    }
  }

  function extractMessage(err: unknown): string {
    const response = (err as { response?: { data?: { message?: string } } })?.response
    return response?.data?.message ?? 'Something went wrong.'
  }

  // SignalR-driven updates — keep the member list live without a refetch.
  function memberJoined(member: { playerId: string; username: string; displayedAchievementKey: string | null }) {
    if (!lobby.value) return
    if (lobby.value.members.some((m) => m.playerId === member.playerId)) return
    lobby.value.members.push({
      playerId: member.playerId,
      username: member.username,
      displayedAchievementKey: member.displayedAchievementKey,
      joinedAtUtc: new Date().toISOString(),
      isHost: false,
    })
  }

  function memberLeft(playerId: string) {
    if (!lobby.value) return
    lobby.value.members = lobby.value.members.filter((m) => m.playerId !== playerId)
  }

  function hostChanged(hostPlayerId: string, hostUsername: string) {
    if (!lobby.value) return
    lobby.value.hostPlayerId = hostPlayerId
    lobby.value.hostUsername = hostUsername
    lobby.value.members = lobby.value.members.map((m) => ({ ...m, isHost: m.playerId === hostPlayerId }))
  }

  function closed() {
    lobby.value = null
  }

  function updateDisplayedAchievement(playerId: string, displayedAchievementKey: string | null) {
    if (!lobby.value) return
    lobby.value.members = lobby.value.members.map((m) =>
      m.playerId === playerId ? { ...m, displayedAchievementKey } : m,
    )
  }

  function clear() {
    lobby.value = null
  }

  return {
    lobby,
    isLoading,
    errorMessage,
    fetchMyLobby,
    create,
    join,
    leave,
    memberJoined,
    memberLeft,
    hostChanged,
    closed,
    updateDisplayedAchievement,
    clear,
  }
})
