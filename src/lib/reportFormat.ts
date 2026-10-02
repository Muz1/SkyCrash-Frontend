// Number formatting shared by the admin reports. Credits are shown as rand (1 credit = R1).

export const rand = (v: number) =>
  `${v < 0 ? '−' : ''}R${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

export const count = (v: number) => v.toLocaleString()

export const pct = (v: number | null | undefined) =>
  v == null ? '—' : `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`

export const mult = (v: number) => `${v.toFixed(2)}x`

export const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`

export const shortDate = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

export const dateTime = (iso: string) => new Date(iso).toLocaleString()

/** Craft/sky ids → display names, from the hangar catalogs. */
export function prettyId(id: string) {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
