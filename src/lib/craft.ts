import neonJet from '@/assets/plane.png'
import ascender from '@/assets/plane-underside.png'
import nighthawk from '@/assets/craft-nighthawk.png'
import millenniumFalcon from '@/assets/craft-millennium-falcon.png'
import portalTraveler from '@/assets/craft-portal-traveler.png'

export type CraftId = 'jet' | 'ascender' | 'nighthawk' | 'millennium-falcon' | 'portal-traveler'

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'SPECIAL'

export interface Craft {
  id: CraftId
  name: string
  rarity: Rarity
  blurb: string
  /** Sprite. Every craft is rendered so the nose points to the top-right. */
  src: string
  /**
   * Degrees needed to rotate the raw sprite so its nose lines up with the
   * canonical 45° bottom-left → top-right flight vector.
   */
  rotate: number
  /** Colour token used for the engine trail. */
  trail: string
}

export const CRAFTS: Craft[] = [
  {
    id: 'jet',
    name: 'Neon Jet',
    rarity: 'COMMON',
    blurb: 'The original Sky Crash airliner, rebuilt for a brilliant arcade climb.',
    src: neonJet,
    rotate: 0,
    trail: 'var(--neon-magenta)',
  },
  {
    id: 'ascender',
    name: 'Ascender',
    rarity: 'RARE',
    blurb: 'The original underside interceptor: sharp wings, twin engines, pure takeoff energy.',
    src: ascender,
    rotate: 45,
    trail: 'var(--neon-magenta)',
  },
  {
    id: 'nighthawk',
    name: 'Night Hawk',
    rarity: 'EPIC',
    blurb: 'A high-altitude interceptor designed for extreme climbs.',
    src: nighthawk,
    rotate: 0,
    trail: 'var(--neon-blue)',
  },
  {
    id: 'millennium-falcon',
    name: 'Millennium Falcon',
    rarity: 'LEGENDARY',
    blurb: 'A faithful animated rendition of the legendary freighter, packed with mechanical detail.',
    src: millenniumFalcon,
    rotate: 0,
    trail: 'var(--neon-blue)',
  },
  {
    id: 'portal-traveler',
    name: 'Portal Traveler',
    rarity: 'SPECIAL',
    blurb: 'A faithful animated portal craft with its original pilots and unstable cartoon technology.',
    src: portalTraveler,
    rotate: -18,
    trail: 'var(--neon-lime)',
  },
]

export function getCraft(id: CraftId): Craft {
  const craft = CRAFTS.find((candidate) => candidate.id === id) ?? CRAFTS[0]
  if (!craft) throw new Error('Sky Crash requires at least one aircraft')
  return craft
}

export const RARITY_STYLE: Record<Rarity, { border: string; text: string; glow: string }> = {
  COMMON: { border: 'border-violet/60', text: 'text-muted-foreground', glow: '' },
  RARE: {
    border: 'border-electric',
    text: 'text-electric',
    glow: '[box-shadow:var(--glow-blue)]',
  },
  EPIC: {
    border: 'border-magenta',
    text: 'text-magenta',
    glow: '[box-shadow:var(--glow-magenta)]',
  },
  LEGENDARY: {
    border: 'border-ember',
    text: 'text-ember',
    glow: '[box-shadow:var(--glow-ember)]',
  },
  SPECIAL: { border: 'border-lime', text: 'text-lime', glow: '[box-shadow:var(--glow-lime)]' },
}
