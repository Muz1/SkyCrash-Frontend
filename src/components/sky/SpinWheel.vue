<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import axios from 'axios'
import { X, RotateCw, Coins, Timer } from '@lucide/vue'
import ArcadeButton from './ArcadeButton.vue'
import * as walletService from '@/services/walletService'
import { usePlayerStore } from '@/stores/playerStore'
import { useCountdown, formatDuration } from '@/composables/useCountdown'
import type { SpinStatus } from '@/types'

/**
 * Free-credits wheel. The server picks the prize and starts the cooldown; this only
 * animates the wheel to the segment it was given, then shows a live countdown until
 * the next spin is allowed.
 */
withDefaults(defineProps<{ outOfCredits?: boolean }>(), { outOfCredits: false })
const emit = defineEmits<{ close: [] }>()

const playerStore = usePlayerStore()
const root = ref<HTMLElement | null>(null)

const status = ref<SpinStatus | null>(null)
const nextSpinAt = ref<string | null>(null)
const { seconds } = useCountdown(nextSpinAt)
const spinning = ref(false)
const rotation = ref(0)
const prize = ref<number | null>(null)
const error = ref<string | null>(null)

const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const SPIN_MS = reduceMotion ? 600 : 4200

const segments = computed(() => status.value?.segments ?? [])
const segAngle = computed(() => (segments.value.length ? 360 / segments.value.length : 0))
const canSpin = computed(() => !!status.value && seconds.value === 0 && !spinning.value)

// SVG wedge for segment i, starting at 12 o'clock and going clockwise.
function wedge(i: number) {
  const r = 100
  const a0 = ((i * segAngle.value - 90) * Math.PI) / 180
  const a1 = (((i + 1) * segAngle.value - 90) * Math.PI) / 180
  const large = segAngle.value > 180 ? 1 : 0
  return `M0 0 L${r * Math.cos(a0)} ${r * Math.sin(a0)} A${r} ${r} 0 ${large} 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`
}
function labelTransform(i: number) {
  return `rotate(${i * segAngle.value + segAngle.value / 2}) translate(0 -64)`
}
const isBig = (amount: number) => amount >= 1000

async function load() {
  try {
    status.value = await walletService.getSpinStatus()
    nextSpinAt.value = status.value.canSpin ? null : status.value.nextSpinAtUtc
  } catch {
    error.value = 'The wheel is unavailable right now.'
  }
}

async function spin() {
  if (!canSpin.value) return
  spinning.value = true
  prize.value = null
  error.value = null
  try {
    const result = await walletService.spinWheel()
    // Land the middle of the winning segment under the pointer, after a few full turns.
    const target = 360 - (result.segmentIndex * segAngle.value + segAngle.value / 2)
    const current = ((rotation.value % 360) + 360) % 360
    rotation.value += (reduceMotion ? 360 : 360 * 6) + ((target - current + 360) % 360)
    await new Promise((r) => setTimeout(r, SPIN_MS))
    prize.value = result.amount
    nextSpinAt.value = result.nextSpinAtUtc
    if (playerStore.profile) playerStore.profile.creditBalance = result.newBalance
  } catch (err: unknown) {
    const data = axios.isAxiosError(err) ? (err.response?.data as { message?: string; nextSpinAtUtc?: string }) : undefined
    error.value = data?.message ?? 'Spin failed. Please try again.'
    if (data?.nextSpinAtUtc) nextSpinAt.value = data.nextSpinAtUtc
  } finally {
    spinning.value = false
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && !spinning.value) emit('close')
}
onMounted(async () => {
  document.addEventListener('keydown', onKeyDown)
  await load()
  await nextTick()
  root.value?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="fixed inset-0 z-[85] grid place-items-center bg-[oklch(0.08_0.04_285/0.85)] p-4 backdrop-blur-sm">
    <div
      ref="root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wheel-title"
      class="clip-hud relative max-h-[calc(100dvh-2rem)] w-[min(28rem,100%)] overflow-y-auto border-2 border-ember bg-void p-5 text-center text-foreground [box-shadow:var(--glow-ember),inset_0_0_32px_color-mix(in_oklab,var(--neon-orange)_12%,transparent)] sm:p-6"
    >
      <button
        type="button"
        aria-label="Close"
        :disabled="spinning"
        class="absolute right-3 top-3 grid h-9 w-9 place-items-center border-2 border-violet/60 text-foreground transition-colors hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember disabled:opacity-40"
        @click="emit('close')"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>

      <h2 id="wheel-title" class="font-display text-lg font-black uppercase tracking-[0.18em] text-ember sm:text-xl">
        {{ outOfCredits ? 'Out of fuel!' : 'Free Credits' }}
      </h2>
      <p class="mt-2 text-base leading-relaxed text-foreground/90">
        {{ outOfCredits ? "You're out of credits. Spin the wheel to refuel and get back in the air." : 'Spin the wheel for free credits.' }}
      </p>

      <div class="relative mx-auto mt-5 aspect-square w-[min(18rem,100%)]">
        <!-- pointer -->
        <svg class="absolute left-1/2 top-[-6px] z-10 h-7 w-7 -translate-x-1/2 drop-shadow-[0_0_6px_var(--neon-orange)]" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 20 L2 2 H18 Z" fill="var(--neon-orange)" stroke="oklch(0.11 0.06 285)" stroke-width="1.5" />
        </svg>
        <svg
          viewBox="-104 -104 208 208"
          class="h-full w-full"
          :style="{ transform: `rotate(${rotation}deg)`, transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.7, 0.16, 1)` : 'none' }"
          role="img"
          :aria-label="`Prize wheel with ${segments.length} prizes: ${segments.join(', ')} credits`"
        >
          <circle r="103" fill="oklch(0.11 0.06 285)" stroke="var(--neon-orange)" stroke-width="3" />
          <g v-for="(amount, i) in segments" :key="i">
            <path
              :d="wedge(i)"
              :fill="isBig(amount) ? 'oklch(0.78 0.17 70)' : i % 2 === 0 ? 'oklch(0.32 0.13 305)' : 'oklch(0.25 0.09 260)'"
              stroke="oklch(0.11 0.06 285)"
              stroke-width="2"
            />
            <text
              :transform="labelTransform(i)"
              text-anchor="middle"
              dominant-baseline="middle"
              :fill="isBig(amount) ? 'oklch(0.15 0.05 285)' : 'oklch(0.98 0.01 260)'"
              font-family="Orbitron, sans-serif"
              font-weight="900"
              font-size="15"
            >
              {{ amount >= 1000 ? `${amount / 1000}K` : amount }}
            </text>
          </g>
          <circle r="18" fill="oklch(0.11 0.06 285)" stroke="var(--neon-orange)" stroke-width="3" />
        </svg>
      </div>

      <p v-if="prize !== null" class="mt-4 font-display text-2xl font-black text-lime" role="status">+{{ prize.toLocaleString() }} credits!</p>
      <p v-if="error" class="mt-4 border-2 border-danger bg-danger/15 px-3 py-2 text-sm font-semibold" role="alert">{{ error }}</p>

      <div class="mt-5 flex flex-col items-center gap-3">
        <ArcadeButton v-if="!status || seconds === 0 || spinning" size="lg" variant="primary" :disabled="!canSpin" data-autofocus @click="spin">
          <RotateCw class="h-5 w-5" :class="spinning && 'animate-spin'" aria-hidden="true" />
          {{ spinning ? 'Spinning…' : 'Spin' }}
        </ArcadeButton>
        <div v-else class="flex flex-col items-center gap-1" role="timer" aria-live="off">
          <span class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground/85">
            <Timer class="h-4 w-4" aria-hidden="true" /> Next spin in
          </span>
          <span class="font-display text-3xl font-black tabular-nums text-foreground">{{ formatDuration(seconds) }}</span>
          <span class="text-sm text-foreground/80">({{ seconds.toLocaleString() }} seconds)</span>
        </div>
        <ArcadeButton v-if="prize !== null || seconds > 0" variant="ghost" data-autofocus @click="emit('close')">
          <Coins class="h-4 w-4" aria-hidden="true" /> {{ prize !== null ? 'Back to the game' : 'Close' }}
        </ArcadeButton>
      </div>
    </div>
  </div>
</template>
