import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authService from '@/services/AuthService'
import type { LoginPayload, RegisterPayload } from '@/types'
import { stopConnection } from '@/services/signalr'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('skycrash_token'))
  const username = ref<string | null>(localStorage.getItem('skycrash_username'))
  const email = ref<string | null>(localStorage.getItem('skycrash_email'))
  const playerId = ref<string | null>(localStorage.getItem('skycrash_player_id'))

  const isAuthenticated = computed(() => !!token.value)

  function setSession(authResponse: { token: string; playerId: string; username: string; email: string }) {
    token.value = authResponse.token
    username.value = authResponse.username
    email.value = authResponse.email
    playerId.value = authResponse.playerId
    localStorage.setItem('skycrash_token', authResponse.token)
    localStorage.setItem('skycrash_username', authResponse.username)
    localStorage.setItem('skycrash_email', authResponse.email)
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
  email.value = null
  playerId.value = null
  localStorage.removeItem('skycrash_token')
  localStorage.removeItem('skycrash_username')
  localStorage.removeItem('skycrash_email')
  localStorage.removeItem('skycrash_player_id')
  stopConnection()
}



  return { token, username, email, playerId, isAuthenticated, register, login, logout }
})
