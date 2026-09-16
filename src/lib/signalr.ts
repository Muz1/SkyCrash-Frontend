import * as signalR from "@microsoft/signalr";
import { API_BASE_URL, getAuthToken } from "./api";

export function createGameHubConnection(): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/game`, {
      accessTokenFactory: () => getAuthToken() ?? "",
    })
    .withAutomaticReconnect()
    .build();
}
