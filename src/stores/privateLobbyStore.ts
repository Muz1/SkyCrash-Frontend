import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as lobbyService from '@/services/lobbyService'
import { LOBBY_CAPACITY } from '@/lib/lobby'
import type { LobbyDetails } from '@/types'

const FULL_MESSAGE = `That lobby is full (${LOBBY_CAPACITY}/${LOBBY_CAPACITY} pilots).`

function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

export const usePrivateLobbyStore = defineStore('privateLobby', () => {
  const lobby = ref<LobbyDetails | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  /** Invite codes we already found full this session, so the join button can stay disabled for them. */
  const fullInviteCodes = ref<string[]>([])

  function isKnownFull(inviteCode: string) {
    return fullInviteCodes.value.includes(normalizeCode(inviteCode))
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
    if (isKnownFull(code)) {
      errorMessage.value = FULL_MESSAGE
      throw new Error(FULL_MESSAGE)
    }

    let joined: LobbyDetails
    try {
      joined = await lobbyService.joinPrivateLobby(code)
    } catch (err) {
      errorMessage.value = extractMessage(err)
      throw err
    }

    // The backend doesn't cap lobby size, and there's no way to peek at a lobby
    // before joining it, so the cap is enforced here: if we'd be pilot #9, step
    // straight back out and report the lobby as full.
    if (joined.members.length > LOBBY_CAPACITY) {
      await lobbyService.leavePrivateLobby().catch(() => undefined)
      lobby.value = null
      fullInviteCodes.value = [...fullInviteCodes.value, code]
      errorMessage.value = FULL_MESSAGE
      throw new Error(FULL_MESSAGE)
    }
    lobby.value = joined
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
