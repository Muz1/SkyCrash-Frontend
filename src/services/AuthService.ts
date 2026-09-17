import api from './api'
import type { AuthResponse, LoginPayload, RegisterPayload, UsernameAvailability } from '@/types'

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', payload)
  return response.data
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', payload)
  return response.data
}

export async function checkUsername(username: string): Promise<UsernameAvailability> {
  const response = await api.get<UsernameAvailability>('/auth/check-username', { params: { username } })
  return response.data
}