import { polishCopy } from '@/copy/polish'

export type TutorialStepKey = 'credits' | 'bet' | 'climb' | 'cashout' | 'crash'

/** The five tutorial steps, in order. Shared by the game-screen overlay and the landing strip. */
const STEP_KEYS: TutorialStepKey[] = ['credits', 'bet', 'climb', 'cashout', 'crash']

export interface TutorialStep {
  key: TutorialStepKey
  title: string
  body: string
}

export const TUTORIAL_STEPS: TutorialStep[] = STEP_KEYS.map((key) => ({ key, ...polishCopy.tutorial.steps[key] }))
