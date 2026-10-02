import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import axios from 'axios'
import * as lobbyService from '@/services/lobbyService'
import { usePublicSettingsStore } from '@/stores/publicSettingsStore'
import { LOBBY_CAPACITY } from '@/lib/lobby'
import type { LobbyDetails, LobbyMemberInfo } from '@/types'

function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

export const usePrivateLobbyStore = defineStore('privateLobby', () => {
  const publicSettings = usePublicSettingsStore()
  const lobby = ref<LobbyDetails | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  /** Invite code the server last rejected as full (409), so the join button can say so. */
  const fullInviteCode = ref<string | null>(null)

  /** Seats per lobby: the joined lobby's own limit, else the admin setting, else the built-in fallback. */
  const capacity = computed(
    () => lobby.value?.maxPlayers ?? publicSettings.settings?.lobbyMaxPlayers ?? LOBBY_CAPACITY,
  )

  function isKnownFull(inviteCode: string) {
    return fullInviteCode.value !== null && fullInviteCode.value === normalizeCode(inviteCode)
  }

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
    const code = normalizeCode(inviteCode)
    try {
      lobby.value = await lobbyService.joinPrivateLobby(code)
      fullInviteCode.value = null
    } catch (err) {
      // The server enforces the seat limit: a full lobby is a 409 (so is "already in a lobby", hence the text check).
      errorMessage.value = extractMessage(err)
      if (axios.isAxiosError(err) && err.response?.status === 409 && /full/i.test(errorMessage.value)) {
        fullInviteCode.value = code
      }
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
  function memberJoined(
    member: Pick<LobbyMemberInfo, 'playerId' | 'username' | 'displayedAchievementKey' | 'equippedCraftId' | 'equippedSkyId'>,
  ) {
    if (!lobby.value) return
    if (lobby.value.members.some((m) => m.playerId === member.playerId)) return
    lobby.value.members.push({
      playerId: member.playerId,
      username: member.username,
      displayedAchievementKey: member.displayedAchievementKey,
      equippedCraftId: member.equippedCraftId ?? null,
      equippedSkyId: member.equippedSkyId ?? null,
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
    capacity,
    isKnownFull,
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
