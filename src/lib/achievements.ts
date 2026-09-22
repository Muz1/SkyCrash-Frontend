import type { AchievementKey } from '@/types'
import clearedForTakeoff from '@/assets/achievements/cleared-for-takeoff.png'
import maybeTakeABreak from '@/assets/achievements/maybe-take-a-break.png'
import frequentFlyer from '@/assets/achievements/frequent-flyer.png'
import veteranPilot from '@/assets/achievements/veteran-pilot.png'
import skyLegend from '@/assets/achievements/sky-legend.png'
import closeCall from '@/assets/achievements/close-call.png'

export const ACHIEVEMENT_BADGES: Record<AchievementKey, string> = {
  ClearedForTakeoff: clearedForTakeoff,
  MaybeTakeABreak: maybeTakeABreak,
  FrequentFlyer: frequentFlyer,
  VeteranPilot: veteranPilot,
  SkyLegend: skyLegend,
  CloseCall: closeCall,
}

export function badgeFor(key: string | null | undefined): string | null {
  if (!key) return null
  return ACHIEVEMENT_BADGES[key as AchievementKey] ?? null
}
