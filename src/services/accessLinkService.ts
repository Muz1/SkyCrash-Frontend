import api from './api'

/** One quick-access link (and its QR code) for a panel pilot. */
export interface AccessLink {
  id: string
  playerId: string
  username: string
  label: string
  url: string
  creditBalance: number
  createdAtUtc: string
  lastUsedAtUtc: string | null
  useCount: number
  active: boolean
}

export async function listAccessLinks(): Promise<AccessLink[]> {
  return (await api.get<AccessLink[]>('/admin/access-links')).data
}

/** Creates whichever of the six panel pilots are missing, each with a link. Safe to repeat. */
export async function createPanelPilots(): Promise<AccessLink[]> {
  return (await api.post<AccessLink[]>('/admin/access-links/panel-pilots')).data
}

export async function regenerateAccessLink(id: string): Promise<AccessLink> {
  return (await api.post<AccessLink>(`/admin/access-links/${id}/regenerate`)).data
}

export async function revokeAccessLink(id: string): Promise<void> {
  await api.post(`/admin/access-links/${id}/revoke`)
}

export interface PanelLobbyMember {
  playerId: string
  username: string
  online: boolean
  joinedAtUtc: string
  equippedCraftId: string | null
}

/** One panel pilot's results over all their settled bets. net = paidOut − wagered. */
export interface PanelLeaderboardRow {
  playerId: string
  username: string
  online: boolean
  inPanelLobby: boolean
  creditBalance: number
  rounds: number
  wins: number
  losses: number
  wagered: number
  paidOut: number
  net: number
  bestCashOutMultiplier: number | null
  biggestWin: number
  lastBetAtUtc: string | null
}

export interface PanelOverview {
  lobbyId: string | null
  lobbyName: string
  inviteCode: string
  members: PanelLobbyMember[]
  leaderboard: PanelLeaderboardRow[]
}

/** The shared panel lobby (every pilot joins it when their link is opened) and the leaderboard. */
export async function getPanelOverview(): Promise<PanelOverview> {
  return (await api.get<PanelOverview>('/admin/access-links/panel')).data
}
