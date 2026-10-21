// Number formatting shared by the admin reports.
// Every admin amount is shown in rands (1 credit is reported as R1) with exactly 2 decimals and
// the same grouping whatever the browser locale: a no-break space between thousands and a "."
// decimal point (R454 048.40), never "R454 048,4".

const NBSP = ' '
const twoDp = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const oneDp = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

const group = (s: string) => s.replace(/,/g, NBSP)
const sign = (v: number) => (v < 0 ? '−' : '')
const safe = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? 0 : v)

/** An amount with 2 decimals, e.g. 454 048.40 (no unit). */
export const amount = (v: number | null | undefined) => {
  const n = safe(v)
  // Round first so -0.004 doesn't print as "−0.00".
  const r = Math.round(n * 100) / 100
  return `${sign(r)}${group(twoDp.format(Math.abs(r)))}`
}

/** Report amounts, in rands: R454 048.40. (Defined below zar so it can reuse it.) */

/** Real money from PayFast purchases: R454 048.40. */
export const zar = (v: number | null | undefined) => {
  const r = Math.round(safe(v) * 100) / 100
  return `${sign(r)}R${group(twoDp.format(Math.abs(r)))}`
}

export const cr = zar

/** Whole-number counts: 1 234. */
export const count = (v: number | null | undefined) => group(whole.format(safe(v)))

export const pct = (v: number | null | undefined) => (v == null ? '—' : `${group(oneDp.format(v))}%`)

/** Percentage with 2 decimals (RTP, hold %). */
export const pct2 = (v: number | null | undefined) => (v == null ? '—' : `${group(twoDp.format(v))}%`)

export const mult = (v: number) => `${v.toFixed(2)}x`

export const plural = (n: number, word: string) => `${count(n)} ${word}${n === 1 ? '' : 's'}`

const asDate = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)

export const shortDate = (iso: string) => asDate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export const longDate = (iso: string) =>
  asDate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** Craft/sky ids → display names, from the hangar catalogs. */
export function prettyId(id: string) {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
