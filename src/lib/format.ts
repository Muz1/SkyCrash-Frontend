/**
 * Number and date formatting for the player screens. One fixed locale everywhere so a
 * phone set to another language still reads "1,234.50" (not "1 234,50"). Credits are play
 * money: never prefixed with "R" (only PayFast prices are rands, see `zar`).
 */
export const LOCALE = 'en-GB'

const credits2 = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const whole = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })

/** Credit amount with exactly 2 decimals: 1,234.50 */
export function creditAmount(n: number | null | undefined): string {
  return credits2.format(Number.isFinite(n as number) ? (n as number) : 0)
}

/** Whole-number credits for labels where decimals would be noise (chips, rates). */
export function creditWhole(n: number): string {
  return whole.format(Math.round(n))
}

/** Signed credit amount: +12.00 / −3.50 */
export function signedCredits(n: number): string {
  return `${n >= 0 ? '+' : '−'}${creditAmount(Math.abs(n))}`
}

export function multiplier(n: number): string {
  return `${n.toFixed(2)}`
}

/** A real-money PayFast price. */
export function zar(n: number): string {
  return `R${credits2.format(n)}`
}

export function dateShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(LOCALE, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
