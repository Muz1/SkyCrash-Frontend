import * as signalR from '@microsoft/signalr'

let connection: signalR.HubConnection | null = null

export function getConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_SIGNALR_HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('skycrash_token') ?? ''
      })
      .withAutomaticReconnect()
      .build()
  }
  return connection
}