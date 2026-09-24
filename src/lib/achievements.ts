import type { AchievementKey } from '@/types'
import clearedForTakeoff from '@/assets/achievements/cleared-for-takeoff.webp'
import maybeTakeABreak from '@/assets/achievements/maybe-take-a-break.webp'
import frequentFlyer from '@/assets/achievements/frequent-flyer.webp'
import veteranPilot from '@/assets/achievements/veteran-pilot.webp'
import skyLegend from '@/assets/achievements/sky-legend.webp'
import closeCall from '@/assets/achievements/close-call.webp'

export interface AchievementBadgeInfo {
  src: string
  name: string
  description: string
  // Each badge has its own colour scheme so players can tell badges apart at a glance;
  // the glow reinforces that colour when the badge is rendered at icon size.
  color: string
}

// Names/descriptions mirror the backend AchievementCatalog, so other players' badges can
// be described without an extra API call.
export const ACHIEVEMENT_BADGES: Record<AchievementKey, AchievementBadgeInfo> = {
  ClearedForTakeoff: { src: clearedForTakeoff, name: 'Cleared for Takeoff', description: 'Play 10 rounds.', color: '#22d3ee' },
  MaybeTakeABreak: { src: maybeTakeABreak, name: 'Maybe Take a Break', description: 'Lose 100 rounds.', color: '#d9f99d' },
  FrequentFlyer: { src: frequentFlyer, name: 'Frequent Flyer', description: 'Play 1,000 rounds.', color: '#3b82f6' },
  VeteranPilot: { src: veteranPilot, name: 'Veteran Pilot', description: 'Successfully cash out 1,000 rounds.', color: '#10b981' },
  SkyLegend: { src: skyLegend, name: 'Sky Legend', description: 'Successfully cash out at 100x or higher.', color: '#a855f7' },
  CloseCall: { src: closeCall, name: 'Close Call', description: 'Cash out within a second of the crash.', color: '#ef4444' },
}

export function badgeInfoFor(key: string | null | undefined): AchievementBadgeInfo | null {
  if (!key) return null
  return ACHIEVEMENT_BADGES[key as AchievementKey] ?? null
}

export function badgeFor(key: string | null | undefined): string | null {
  return badgeInfoFor(key)?.src ?? null
}
