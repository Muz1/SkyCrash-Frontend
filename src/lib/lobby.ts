import { CRAFTS, DEFAULT_CRAFT, type CraftId } from '@/lib/craft'
import { DEFAULT_SKIN, SKY_SKINS, type SkinId } from '@/lib/skins'

/**
 * Fallback seat limit for a private lobby. The real limit is admin-configurable
 * and comes from the server (LobbyDetails.maxPlayers / public settings), which
 * also enforces it by rejecting joins to a full lobby with a 409.
 */
export const LOBBY_CAPACITY = 8

/** A lobby-mate drawn as a background aircraft. */
export interface LobbyMate {
  playerId: string
  username: string
  craftId: CraftId
  skyId: SkinId
}

/** The equipped craft a lobby member flies; the default jet if unknown or never saved. */
export function craftForMember(member: { equippedCraftId?: string | null }): CraftId {
  return CRAFTS.find((c) => c.id === member.equippedCraftId)?.id ?? DEFAULT_CRAFT
}

/** The equipped sky a lobby member picked; tints their trail in the lobby. */
export function skyForMember(member: { equippedSkyId?: string | null }): SkinId {
  return SKY_SKINS.find((s) => s.id === member.equippedSkyId)?.id ?? DEFAULT_SKIN
}

export function isLobbyFull(memberCount: number, capacity = LOBBY_CAPACITY) {
  return memberCount >= capacity
}

/** A stable colour per username for the initial-letter avatar (there are no avatar images). */
export function avatarColour(username: string) {
  let hash = 0
  for (const ch of username) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return `oklch(0.72 0.19 ${hash % 360})`
}

export function avatarInitial(username: string) {
  return (username.trim()[0] ?? '?').toUpperCase()
}
