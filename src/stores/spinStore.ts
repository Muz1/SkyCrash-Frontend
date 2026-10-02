import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as walletService from '@/services/walletService'
import type { SpinResult, SpinStatus } from '@/types'

/**
 * The credit wheel's prizes and cooldown, shared by the wheel itself and the "next spin"
 * timer on the betting screen, so spinning in one place updates the other.
 */
export const useSpinStore = defineStore('spin', () => {
  const status = ref<SpinStatus | null>(null)
  /** When the next spin unlocks; null when a spin is available now. */
  const nextSpinAt = ref<string | null>(null)
  const loadError = ref(false)

  const segments = computed(() => status.value?.segments ?? [])
  /** Chance per segment; equal odds when the server doesn't say. */
  const odds = computed(() =>
    status.value?.odds?.length === segments.value.length
      ? status.value.odds!
      : segments.value.map(() => 1 / Math.max(1, segments.value.length)),
  )
  const topPrize = computed(() => (segments.value.length ? Math.max(...segments.value) : 0))

  async function load() {
    try {
      status.value = await walletService.getSpinStatus()
      nextSpinAt.value = status.value.canSpin ? null : status.value.nextSpinAtUtc
      loadError.value = false
    } catch {
      loadError.value = true
    }
  }

  function applyResult(result: SpinResult) {
    nextSpinAt.value = result.nextSpinAtUtc
  }

  function clear() {
    status.value = null
    nextSpinAt.value = null
  }

  return { status, nextSpinAt, loadError, segments, odds, topPrize, load, applyResult, clear }
})
