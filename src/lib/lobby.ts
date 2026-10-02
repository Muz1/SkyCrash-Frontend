import { CRAFTS, DEFAULT_CRAFT, type CraftId } from '@/lib/craft'

/**
 * Hard cap on pilots per private lobby. Enforced on the frontend only — the
 * backend's LobbyService.JoinLobbyAsync has no capacity check today.
 */
export const LOBBY_CAPACITY = 8

/** A lobby-mate drawn as a background aircraft. */
export interface LobbyMate {
  playerId: string
  username: string
  craftId: CraftId
}

/**
 * The craft a lobby member flies. Lobby payloads don't carry the equipped
 * loadout yet (it only lives in each player's localStorage), so this reads an
 * `equippedCraftId` field if the backend ever adds one and otherwise falls back
 * to the default jet.
 */
export function craftForMember(member: object): CraftId {
  const raw = 'equippedCraftId' in member ? (member as { equippedCraftId?: unknown }).equippedCraftId : undefined
  const match = CRAFTS.find((c) => c.id === raw)
  return match ? match.id : DEFAULT_CRAFT
}

export function isLobbyFull(memberCount: number) {
  return memberCount >= LOBBY_CAPACITY
}
