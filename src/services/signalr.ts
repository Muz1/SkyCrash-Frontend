import * as signalR from '@microsoft/signalr'
import { SIGNALR_HUB_URL } from '@/lib/apiUrls'

let connection: signalR.HubConnection | null = null

export function getConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('skycrash_token') ?? ''
      })
      .withAutomaticReconnect()
      .build()
  }
  return connection
}

export async function stopConnection(): Promise<void> {
  if (connection) {
    await connection.stop()
    connection = null
  }
}