import { getConnection } from './signalr'

export async function placeBet(amount: number): Promise<void> {
  const connection = getConnection()
  await connection.invoke('PlaceBet', amount)
}
export async function cashOut(): Promise<void> {
  const connection = getConnection()
  await connection.invoke('CashOut')
}
