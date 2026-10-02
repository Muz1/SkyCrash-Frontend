import clearedForTakeoff from '@/assets/achievements/cleared-for-takeoff.webp'
import maybeTakeABreak from '@/assets/achievements/maybe-take-a-break.webp'
import frequentFlyer from '@/assets/achievements/frequent-flyer.webp'
import veteranPilot from '@/assets/achievements/veteran-pilot.webp'
import skyLegend from '@/assets/achievements/sky-legend.webp'
import closeCall from '@/assets/achievements/close-call.webp'

/**
 * Badges earned by completing daily challenges, one per challenge category. They reuse
 * the existing badge artwork; the name and colour ring tell them apart from the
 * permanent achievements. Keys mirror the backend's ChallengeCatalog.BadgeFor.
 */
export interface ChallengeBadgeInfo {
  src: string
  name: string
  description: string
  color: string
}

export const CHALLENGE_BADGES: Record<string, ChallengeBadgeInfo> = {
  DailyFlyer: { src: clearedForTakeoff, name: 'Daily Flyer', description: 'Complete a "play N rounds" challenge.', color: '#22d3ee' },
  RushHour: { src: maybeTakeABreak, name: 'Rush Hour', description: 'Play a burst of rounds against the clock.', color: '#facc15' },
  AcePilot: { src: veteranPilot, name: 'Ace Pilot', description: 'Cash out on a set number of rounds.', color: '#10b981' },
  HighAltitude: { src: skyLegend, name: 'High Altitude', description: 'Cash out at a big multiplier.', color: '#a855f7' },
  HotStreak: { src: closeCall, name: 'Hot Streak', description: 'Cash out several rounds in a row.', color: '#f97316' },
  MultiplierMiner: { src: skyLegend, name: 'Multiplier Miner', description: 'Bank a combined multiplier across the day.', color: '#ec4899' },
  JackpotJockey: { src: frequentFlyer, name: 'Jackpot Jockey', description: 'Land one huge payout in a single round.', color: '#fde047' },
  Payday: { src: veteranPilot, name: 'Payday', description: 'Earn a pile of credits from cash outs.', color: '#84cc16' },
  HighRoller: { src: frequentFlyer, name: 'High Roller', description: 'Bet big, in total or in one go.', color: '#3b82f6' },
  SquadLeader: { src: clearedForTakeoff, name: 'Squad Leader', description: 'Get friends to join your lobby.', color: '#f43f5e' },
  Wingman: { src: closeCall, name: 'Wingman', description: 'Play rounds in a lobby with friends.', color: '#38bdf8' },
}

export function challengeBadgeFor(key: string | null | undefined): ChallengeBadgeInfo | null {
  if (!key) return null
  return CHALLENGE_BADGES[key] ?? null
}

/** Challenge types that need a lobby, so the UI can point players at it. */
export const SOCIAL_CHALLENGE_TYPES = new Set(['InviteFriends', 'PlayRoundsWithFriends'])
