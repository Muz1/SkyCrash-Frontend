import { getConnection } from './signalr'

export async function placeBet(amount: number, autoCashoutTarget?: number | null): Promise<void> {
  const connection = getConnection()
  await connection.invoke('PlaceBet', amount, autoCashoutTarget ?? null)
}
export async function cashOut(): Promise<void> {
  const connection = getConnection()
  await connection.invoke('CashOut')
}
