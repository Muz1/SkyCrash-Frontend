import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as walletService from '@/services/walletService'
import { usePlayerStore } from '@/stores/playerStore'
import { apiError } from '@/lib/apiError'
import { en } from '@/copy/en'
import type { LastSpin, SpinResult, SpinStatus } from '@/types'

/**
 * What this browser has shown, per player: `pending` while a paid spin hasn't been revealed
 * yet (set when the POST answers, cleared when the wheel stops), and `seen` = the server
 * time of the last spin already accounted for ('latest' = whatever the server says next).
 * Comparing server times only with server times keeps clock skew out of it.
 */
const SEEN_KEY = 'skycrash_spin_seen'
type SeenState = { pending?: { amount: number; segmentIndex: number } | null; seen?: string | null }

function seenKey() {
  return `${SEEN_KEY}_${localStorage.getItem('skycrash_player_id') ?? 'anon'}`
}
function readSeen(): SeenState {
  try {
    return JSON.parse(localStorage.getItem(seenKey()) ?? '{}') as SeenState
  } catch {
    return {}
  }
}
function writeSeen(state: SeenState) {
  try {
    localStorage.setItem(seenKey(), JSON.stringify(state))
  } catch {
    // Storage unavailable: the "last spin" note just won't show.
  }
}

function newKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export type SpinFailure = { kind: 'email-unverified' | 'restricted' | 'limit' | 'cooldown' | 'error'; message: string }

/**
 * The credit wheel's prizes and cooldown, shared by the wheel itself and the "next spin"
 * timer on the betting screen.
 *
 * The prize is applied the moment the server answers (balance and next-spin time), not when
 * the wheel stops: the animation only reveals it. Leaving mid-spin therefore never "uses" a
 * spin without paying it, and the next visit says "You won X on your last spin".
 */
export const useSpinStore = defineStore('spin', () => {
  const status = ref<SpinStatus | null>(null)
  /** When the next spin unlocks; null when a spin is available now. */
  const nextSpinAt = ref<string | null>(null)
  const loadError = ref(false)
  /** A spin that paid out but was never revealed in this browser (left mid-animation). */
  const unseenLastSpin = ref<LastSpin | null>(null)

  const segments = computed(() => status.value?.segments ?? [])
  /** Chance per segment; equal odds when the server doesn't say. */
  const odds = computed(() =>
    status.value?.odds?.length === segments.value.length
      ? status.value.odds!
      : segments.value.map(() => 1 / Math.max(1, segments.value.length)),
  )
  const topPrize = computed(() => (segments.value.length ? Math.max(...segments.value) : 0))
  const spinsLeftToday = computed(() => status.value?.spinsLeftToday ?? null)

  async function load() {
    try {
      status.value = await walletService.getSpinStatus()
      nextSpinAt.value = status.value.canSpin ? null : status.value.nextSpinAtUtc
      loadError.value = false
      const last = status.value.lastSpin ?? null
      const state = readSeen()
      const newer = !!last && !!state.seen && state.seen !== 'latest' && Date.parse(last.spunAtUtc) > Date.parse(state.seen)
      if (last && (state.pending || newer)) {
        // Paid but never revealed here (left mid-spin, or spun in another tab).
        unseenLastSpin.value = last
      } else {
        unseenLastSpin.value = null
        writeSeen({ seen: last?.spunAtUtc ?? null })
      }
    } catch {
      loadError.value = true
    }
  }

  function applyResult(result: SpinResult) {
    nextSpinAt.value = result.nextSpinAtUtc
    const player = usePlayerStore()
    if (player.profile) player.profile.creditBalance = result.newBalance
    if (status.value) {
      const left = status.value.spinsLeftToday
      status.value = {
        ...status.value,
        canSpin: false,
        nextSpinAtUtc: result.nextSpinAtUtc,
        spinsLeftToday: typeof left === 'number' ? Math.max(0, left - 1) : left,
        lastSpin: { amount: result.amount, segmentIndex: result.segmentIndex, spunAtUtc: new Date().toISOString() },
      }
    }
  }

  /**
   * Spins once. Resolves the result (already applied) or a short failure. One idempotency key
   * per spin, so a network retry returns the same prize instead of spending another spin.
   */
  async function spin(): Promise<{ ok: true; result: SpinResult } | { ok: false; failure: SpinFailure }> {
    const key = newKey()
    try {
      const result = await walletService.spinWheel(key)
      applyResult(result)
      writeSeen({ ...readSeen(), pending: { amount: result.amount, segmentIndex: result.segmentIndex } })
      return { ok: true, result }
    } catch (err) {
      const { status: code, data } = apiError<{ code?: string; message?: string; nextSpinAtUtc?: string }>(err)
      if (code === 403 && data?.code === 'email-unverified') return { ok: false, failure: { kind: 'email-unverified', message: en.verifyEmail.neededSpin } }
      if (code === 403) return { ok: false, failure: { kind: 'restricted', message: en.spin.restricted } }
      if (code === 429) {
        if (data?.nextSpinAtUtc) nextSpinAt.value = data.nextSpinAtUtc
        const daily = /today/i.test(data?.message ?? '')
        if (daily && status.value) status.value = { ...status.value, spinsLeftToday: 0 }
        return { ok: false, failure: { kind: daily ? 'limit' : 'cooldown', message: daily ? en.spin.noneLeft : (data?.message ?? en.common.tryAgain) } }
      }
      return { ok: false, failure: { kind: 'error', message: data?.message ?? 'Spin failed. Please try again.' } }
    }
  }

  /** The wheel revealed the prize, or the "last spin" note was shown. */
  function markSeen() {
    writeSeen({ seen: unseenLastSpin.value?.spunAtUtc ?? 'latest', pending: null })
    unseenLastSpin.value = null
  }

  function clear() {
    status.value = null
    nextSpinAt.value = null
    unseenLastSpin.value = null
  }

  return {
    status,
    nextSpinAt,
    loadError,
    unseenLastSpin,
    segments,
    odds,
    topPrize,
    spinsLeftToday,
    load,
    applyResult,
    spin,
    markSeen,
    clear,
  }
})
