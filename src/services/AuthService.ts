import api from './api'
import type { AuthResponse, LoginPayload, RegisterPayload } from '@/types'

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', payload)
  return response.data
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', payload)
  return response.data
}