<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRef } from 'vue'
import { Timer } from '@lucide/vue'
import ArcadeButton from './ArcadeButton.vue'
import logo from '@/assets/logo-skycrash.png'
import { useResendVerification } from '@/composables/useResendVerification'
import { creditAmount } from '@/lib/format'
import { en } from '@/copy/en'
import { usePlayerStore } from '@/stores/playerStore'
import { useSpinStore } from '@/stores/spinStore'
import { useCountdown, formatDuration } from '@/composables/useCountdown'

/**
 * The Sky Crash credit wheel, the game's only source of free credits. The server picks the
 * prize and starts the cooldown; this only spins the wheel to the segment it was told,
 * then counts down to the next spin.
 */
const SPIN_DURATION = 5200

const playerStore = usePlayerStore()
const spinStore = useSpinStore()
const status = toRef(spinStore, 'status')
const { seconds } = useCountdown(toRef(spinStore, 'nextSpinAt'))
const rotation = ref(0)
const spinning = ref(false)
const prize = ref<number | null>(null)
const error = ref<string | null>(null)
/** The spin needs a verified email: offer Resend right there. */
const needsEmail = ref(false)
const resender = useResendVerification()
/** Balance shown while the wheel turns: the prize is already paid, but the wheel reveals it. */
const balanceBeforeSpin = ref<number | null>(null)
const shownBalance = computed(() => balanceBeforeSpin.value ?? playerStore.profile?.creditBalance ?? 0)
/** "You won X on your last spin": a paid spin this browser never revealed. */
const lastSpinNote = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

const reduceMotion =
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const duration = reduceMotion ? 700 : SPIN_DURATION

const prizes = computed(() => spinStore.segments)

/** Wheel labels stay short so big prizes fit their wedge: 750 · 2.5K · 10K. */
function wheelLabel(value: number) {
  if (value < 1000) return value.toLocaleString()
  const k = value / 1000
  return `${Number.isInteger(k) ? k : k.toFixed(1)}K`
}

/** Prize table, biggest first, with each prize's real chance per spin. */
const prizeTable = computed(() => {
  const totals = new Map<number, number>()
  prizes.value.forEach((p, i) => totals.set(p, (totals.get(p) ?? 0) + (spinStore.odds[i] ?? 0)))
  return [...totals.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([prize, chance]) => ({ prize, chance }))
})
function pct(chance: number) {
  const v = chance * 100
  return v < 1 ? v.toFixed(1) : Math.round(v).toString()
}
const segmentAngle = computed(() => (prizes.value.length ? 360 / prizes.value.length : 45))
const canSpin = computed(() => !!status.value && seconds.value === 0 && !spinning.value)

// Alternating neon wedges, each centred on its label (labels sit at index × angle).
const SEGMENT_COLOURS = [
  'var(--neon-magenta)',
  'var(--neon-violet)',
  'var(--neon-blue)',
  'var(--neon-orange)',
]
const face = computed(() => {
  const a = segmentAngle.value
  const stops = prizes.value
    .map((_, i) => `${SEGMENT_COLOURS[i % SEGMENT_COLOURS.length]} ${i * a}deg ${(i + 1) * a}deg`)
    .join(', ')
  return `conic-gradient(from ${-a / 2}deg, ${stops})`
})
function labelStyle(index: number) {
  const angle = index * segmentAngle.value
  const rad = (angle * Math.PI) / 180
  // Labels on the lower half are turned the other way so none read upside down.
  const upright = angle > 90 && angle < 270 ? angle + 180 : angle
  return {
    left: `${50 + Math.sin(rad) * 36}%`,
    top: `${50 - Math.cos(rad) * 36}%`,
    transform: `translate(-50%, -50%) rotate(${upright}deg)`,
  }
}

async function load() {
  await spinStore.load()
  if (spinStore.loadError) error.value = 'The wheel is unavailable right now.'
  if (spinStore.unseenLastSpin) {
    lastSpinNote.value = en.spin.lastSpin(creditAmount(spinStore.unseenLastSpin.amount))
    spinStore.markSeen()
  }
}

async function spin() {
  if (!canSpin.value) return
  spinning.value = true
  prize.value = null
  error.value = null
  needsEmail.value = false
  lastSpinNote.value = null
  balanceBeforeSpin.value = playerStore.profile?.creditBalance ?? null
  // The store applies the prize (balance, next spin) as soon as the server answers.
  const outcome = await spinStore.spin()
  if (!outcome.ok) {
    error.value = outcome.failure.message
    needsEmail.value = outcome.failure.kind === 'email-unverified'
    balanceBeforeSpin.value = null
    spinning.value = false
    return
  }
  const result = outcome.result
  // Bring the winning label to the pointer at 12 o'clock after six full turns.
  const current = ((rotation.value % 360) + 360) % 360
  const destination = (((360 - result.segmentIndex * segmentAngle.value) % 360) + 360) % 360
  rotation.value += (reduceMotion ? 360 : 360 * 6) + ((destination - current + 360) % 360)
  timer = setTimeout(() => {
    prize.value = result.amount
    spinStore.markSeen()
    balanceBeforeSpin.value = null
    spinning.value = false
    timer = null
  }, duration)
}

onMounted(load)
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <!--
    Wheel and controls side by side on wider screens, stacked on phones. The wheel's size
    follows the screen height so the whole thing always fits without scrolling.
  -->
  <section
    aria-label="Credit spin wheel"
    class="mx-auto flex w-full flex-col items-center gap-2 text-center md:flex-row md:justify-center md:gap-10"
  >
    <div
      class="relative aspect-square w-[min(100%,33dvh,340px)] shrink-0 p-2 md:w-[min(56dvh,460px)] md:p-4"
    >
      <div class="wheel-aura absolute inset-[3%] rounded-full" aria-hidden="true" />
      <div
        class="absolute inset-[2%] rounded-full border-2 border-ember/60 [box-shadow:var(--glow-ember)]"
        aria-hidden="true"
      />
      <div
        class="absolute inset-[5%] rounded-full border-[5px] border-void bg-deep p-[3px] sm:border-[8px]"
      >
        <div
          class="relative h-full w-full overflow-hidden rounded-full border-2 border-foreground/50"
          :style="{
            background: face,
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? `transform ${duration}ms cubic-bezier(0.12, 0.7, 0.08, 1)`
              : 'none',
          }"
          role="img"
          :aria-label="`Prize wheel: ${prizes.map((p) => p.toLocaleString()).join(', ')} credits`"
        >
          <!-- spokes between segments -->
          <span
            v-for="(_, i) in prizes"
            :key="`spoke-${i}`"
            class="absolute left-1/2 top-0 h-1/2 w-[2px] origin-bottom -translate-x-1/2 bg-void/70"
            :style="{ transform: `rotate(${(i + 0.5) * segmentAngle}deg)` }"
            aria-hidden="true"
          />
          <span
            v-for="(value, i) in prizes"
            :key="i"
            class="absolute font-arcade text-[0.625rem] text-foreground [text-shadow:0_2px_3px_var(--bg-void)] sm:text-sm"
            :style="labelStyle(i)"
            aria-hidden="true"
          >
            {{ wheelLabel(value) }}
          </span>
        </div>
      </div>
      <div
        class="wheel-pointer absolute left-1/2 top-0 z-10 h-[15%] w-[11%] -translate-x-1/2"
        aria-hidden="true"
      />
      <div
        class="absolute left-1/2 top-1/2 z-10 grid aspect-square w-[34%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-ember bg-void p-[3%] [box-shadow:var(--glow-ember)]"
        aria-hidden="true"
      >
        <img :src="logo" alt="" class="h-auto w-full object-contain" />
      </div>
    </div>

    <div class="flex w-full max-w-sm flex-col items-center">
      <div aria-live="polite" class="min-h-12">
        <p
          v-if="prize !== null"
          class="animate-sky-pop font-display text-2xl font-black uppercase text-lime text-glow-lime sm:text-3xl"
        >
          +{{ prize.toLocaleString() }} credits!
        </p>
        <p v-else class="font-arcade text-[0.625rem] uppercase leading-relaxed text-foreground/85">
          {{ spinning ? 'Spinning…' : 'Spin to earn arcade credits' }}
        </p>
        <p class="mt-2 font-arcade text-[0.625rem] uppercase text-ember">
          Balance {{ shownBalance.toLocaleString() }}
        </p>
        <p v-if="spinStore.spinsLeftToday !== null" class="mt-1 text-sm text-foreground/80">
          {{ spinStore.spinsLeftToday > 0 ? en.spin.spinsLeft(spinStore.spinsLeftToday) : en.spin.noneLeft }}
        </p>
      </div>

      <p
        v-if="error"
        role="alert"
        class="mx-auto mt-3 max-w-sm border-2 border-danger bg-danger/15 px-3 py-2 text-sm font-semibold"
      >
        {{ error }}
        <button
          v-if="needsEmail"
          type="button"
          class="ml-1 font-bold text-ember underline underline-offset-2 pointer-coarse:min-h-11 disabled:opacity-50"
          :disabled="resender.sending.value"
          @click="resender.resend()"
        >
          {{ en.verifyEmail.resend }}
        </button>
        <span v-if="resender.message.value" class="block text-xs">{{ resender.message.value }}</span>
      </p>
      <p v-if="lastSpinNote" role="status" class="mx-auto mt-3 max-w-sm border-2 border-lime bg-lime/10 px-3 py-2 text-sm font-semibold text-lime">
        {{ lastSpinNote }}
      </p>

      <ArcadeButton
        v-if="!status || seconds === 0 || spinning"
        type="button"
        size="xl"
        class="mt-2 min-w-48 md:mt-4"
        :disabled="!canSpin || spinStore.spinsLeftToday === 0"
        @click="spin"
      >
        {{ spinning ? 'Spinning…' : 'Spin Wheel' }}
      </ArcadeButton>
      <div v-else class="mt-2 flex flex-col items-center gap-0.5 md:mt-4" role="timer">
        <span
          class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground/85"
        >
          <Timer class="h-4 w-4" aria-hidden="true" /> Next spin in
        </span>
        <span class="font-display text-3xl font-black tabular-nums text-foreground md:text-4xl">{{
          formatDuration(seconds)
        }}</span>
        <span class="text-sm text-foreground/75">({{ seconds.toLocaleString() }} seconds)</span>
      </div>

      <!-- what's on the wheel, and how likely each prize is -->
      <div v-if="prizeTable.length" class="mt-3 w-full text-left md:mt-6">
        <p class="font-arcade text-[0.5rem] uppercase tracking-[0.25em] text-muted-foreground">
          Prizes &amp; odds per spin
        </p>
        <ul class="mt-1 grid grid-cols-2 gap-x-4">
          <li
            v-for="row in prizeTable"
            :key="row.prize"
            class="flex items-baseline justify-between gap-2 border-b border-violet/30 py-px md:py-0.5"
          >
            <span
              :class="[
                'font-arcade text-[0.625rem] tabular-nums',
                row.prize >= 2500 ? 'text-ember' : 'text-foreground',
              ]"
              >{{ row.prize.toLocaleString() }}</span
            >
            <span class="text-sm tabular-nums text-foreground/80">{{ pct(row.chance) }}%</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wheel-aura {
  background: radial-gradient(
    circle,
    color-mix(in oklab, var(--neon-orange) 35%, transparent) 0%,
    transparent 70%
  );
  filter: blur(18px);
  animation: wheel-aura 3.2s ease-in-out infinite;
}
.wheel-pointer {
  background: var(--neon-orange);
  clip-path: polygon(50% 100%, 0 0, 100% 0);
  filter: drop-shadow(0 0 8px var(--neon-orange));
}
@keyframes wheel-aura {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.97);
  }
  50% {
    opacity: 1;
    transform: scale(1.03);
  }
}
@media (prefers-reduced-motion: reduce) {
  .wheel-aura {
    animation: none;
  }
}
</style>
