import sunsetRunway from '@/assets/env-sunset-runway.jpg'
import cloudCity from '@/assets/env-cloud-city.jpg'
import deepSpace from '@/assets/env-deep-space.jpg'
import capeTown from '@/assets/env-cape-town.jpg'
import johannesburg from '@/assets/env-johannesburg.jpg'
import durban from '@/assets/env-durban.jpg'
import midnight from '@/assets/env-midnight.jpg'

export type SkinId =
  | 'sunset-runway'
  | 'cloud-city'
  | 'deep-space'
  | 'cape-town'
  | 'johannesburg'
  | 'durban'
  | 'midnight'
  | 'taking-off'

/** The sky every pilot starts with. */
export const DEFAULT_SKIN: SkinId = 'sunset-runway'

export interface SkySkin {
  id: SkinId
  name: string
  src: string
  blurb: string
  /** Environment mood: drives ambient particles and lighting. */
  mood: 'ground' | 'high' | 'space'
  /** Signature colour of the sky, used to tint a pilot's trail in the lobby. */
  tint: string
}

export const SKY_SKINS: SkySkin[] = [
  {
    id: 'sunset-runway',
    name: 'Sunset Runway',
    src: sunsetRunway,
    blurb: 'Where every flight begins.',
    mood: 'ground',
    tint: 'var(--neon-orange)',
  },
  {
    id: 'cloud-city',
    name: 'Cloud City',
    src: cloudCity,
    blurb: 'Above the weather, below the stars.',
    mood: 'high',
    tint: 'var(--neon-blue)',
  },
  {
    id: 'cape-town',
    name: 'Cape Town',
    src: capeTown,
    blurb: 'Table Mountain, the Atlantic and a burning horizon.',
    mood: 'ground',
    tint: 'var(--neon-magenta)',
  },
  {
    id: 'johannesburg',
    name: 'Johannesburg',
    src: johannesburg,
    blurb: 'Gold-hour towers and highways full of light.',
    mood: 'ground',
    tint: 'oklch(0.84 0.17 85)',
  },
  {
    id: 'durban',
    name: 'Durban',
    src: durban,
    blurb: 'Warm Indian Ocean air over the beachfront.',
    mood: 'ground',
    tint: 'oklch(0.8 0.15 190)',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    src: midnight,
    blurb: 'Moonlight on the cloud deck.',
    mood: 'high',
    tint: 'var(--neon-violet)',
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    src: deepSpace,
    blurb: 'Nothing left but the void.',
    mood: 'space',
    tint: 'oklch(0.7 0.2 280)',
  },
  {
    id: 'taking-off',
    name: 'Taking Off',
    src: sunsetRunway,
    blurb: 'Runway to orbit as the multiplier climbs.',
    mood: 'ground',
    tint: 'var(--neon-lime)',
  },
]

export function skinSrc(id: SkinId) {
  return SKY_SKINS.find((s) => s.id === id)?.src ?? sunsetRunway
}

export function skinTint(id: SkinId) {
  return SKY_SKINS.find((s) => s.id === id)?.tint ?? 'var(--neon-orange)'
}

export function skinMood(id: SkinId) {
  return SKY_SKINS.find((s) => s.id === id)?.mood ?? 'ground'
}

/** Opacities for the three sky layers of the "taking off" skin. */
export function ascentLayers(progress: number) {
  const p = Math.max(0, Math.min(1, progress))
  const cloud = Math.max(0, Math.min(1, (p - 0.12) / 0.36))
  const space = Math.max(0, Math.min(1, (p - 0.52) / 0.38))
  return { cloud, space }
}
