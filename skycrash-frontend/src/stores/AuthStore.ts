import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authService from '@/services/AuthService'
import type { LoginPayload, RegisterPayload } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('skycrash_token'))
  const username = ref<string | null>(localStorage.getItem('skycrash_username'))
  const playerId = ref<string | null>(localStorage.getItem('skycrash_player_id'))

  const isAuthenticated = computed(() => !!token.value)

  function setSession(authResponse: { token: string; playerId: string; username: string }) {
    token.value = authResponse.token
    username.value = authResponse.username
    playerId.value = authResponse.playerId
    localStorage.setItem('skycrash_token', authResponse.token)
    localStorage.setItem('skycrash_username', authResponse.username)
    localStorage.setItem('skycrash_player_id', authResponse.playerId)
  }

  async function register(payload: RegisterPayload) {
    const response = await authService.register(payload)
    setSession(response)
  }

  async function login(payload: LoginPayload) {
    const response = await authService.login(payload)
    setSession(response)
  }

  function logout() {
    token.value = null
    username.value = null
    playerId.value = null
    localStorage.removeItem('skycrash_token')
    localStorage.removeItem('skycrash_username')
    localStorage.removeItem('skycrash_player_id')
  }

  return { token, username, playerId, isAuthenticated, register, login, logout }
})