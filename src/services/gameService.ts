import { getConnection } from './signalr'
import type { LobbyRoundBet } from '@/types'

export async function placeBet(amount: number, autoCashoutTarget?: number | null): Promise<void> {
  const connection = getConnection()
  await connection.invoke('PlaceBet', amount, autoCashoutTarget ?? null)
}
export async function cashOut(): Promise<void> {
  const connection = getConnection()
  await connection.invoke('CashOut')
}

/** Everyone in my private lobby and their bet on the current round (empty when I'm not in one). */
export async function getLobbyRoundBets(): Promise<LobbyRoundBet[]> {
  const connection = getConnection()
  if (connection.state !== 'Connected') return []
  return connection.invoke<LobbyRoundBet[]>('GetLobbyRoundBets')
}
