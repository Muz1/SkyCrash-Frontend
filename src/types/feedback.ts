// Player-side feedback types. The shared status/result shapes live in
// types/insights.ts; these add the newer fields the player form uses.
import type { FeedbackStatus } from '@/types/insights'

/** "What would you like us to add?" options, mapped to the tag values the backend stores. */
export const FEATURE_REQUESTS = [
  { tag: 'PlaneSkins', label: 'New plane skins' },
  { tag: 'Skies', label: 'New skies' },
  { tag: 'Multiplayer', label: 'Multiplayer' },
  { tag: 'GameModes', label: 'New game modes' },
  { tag: 'BetterUI', label: 'Better UI' },
  { tag: 'SoundMusic', label: 'Sound/music' },
  { tag: 'Rewards', label: 'Rewards' },
  { tag: 'Other', label: 'Other' },
] as const

export type FeatureRequestTag = (typeof FEATURE_REQUESTS)[number]['tag']

/** POST /api/feedback body. */
export interface FeedbackSubmission {
  rating: number
  likedText?: string
  improveText?: string
  tags: FeatureRequestTag[]
  additionalComment?: string
}

/** GET /api/feedback/status, including the cash-out based schedule fields. */
export interface PlayerFeedbackStatus extends FeedbackStatus {
  /** True when a submission right now would be rewarded. Older servers omit it. */
  rewardAvailable?: boolean
  cashOuts?: number
  nextPromptAtCashOut?: number
}
