export const BET_STEPS = [100, 250, 500, 1000, 2000, 5000] as const

export function formatBet(v: number) {
  return v >= 1000 ? `${v / 1000}K` : `${v}`
}
