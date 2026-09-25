<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useFlightClock, multiplierAt, secondsAt, GROWTH } from '@/composables/useFlightClock'
import { getCraft, type CraftId } from '@/lib/craft'
import Plane from './Plane.vue'
import Explosion from './Explosion.vue'

/**
 * Crash-game flight graph. Time runs along x, multiplier up y, and the curve
 * is the same e^(GROWTH·t) the server uses, so the plane at its tip is always
 * exactly where the multiplier says it is. The axes start fixed (the plane
 * climbs up and to the right), then rescale once it reaches its cruising spot
 * near the top-right so it holds position while the curve compresses behind.
 */
const props = defineProps<{ craft: CraftId }>()

const gameStore = useGameStore()
const { multiplier, elapsed } = useFlightClock()

const root = ref<HTMLElement | null>(null)
const width = ref(0)
const height = ref(0)
let observer: ResizeObserver | null = null

onMounted(() => {
  if (!root.value) return
  const measure = () => {
    width.value = root.value?.clientWidth ?? 0
    height.value = root.value?.clientHeight ?? 0
  }
  measure()
  observer = new ResizeObserver(measure)
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())

const flying = computed(() => gameStore.phase === 'Running')
const crashed = computed(() => gameStore.phase === 'Crashed')
const waiting = computed(() => gameStore.phase === 'Waiting')
const airborne = computed(() => flying.value || crashed.value)

// ---------- geometry ----------

/** Minimum visible window before the axes start to rescale. */
const MIN_SECONDS = 8
const MIN_MULTIPLIER = 1.8
/** Where the plane "cruises" once the axes are rescaling (fraction of plot). */
const CRUISE_X = 0.82
const CRUISE_Y = 0.78

const planeSize = computed(() => Math.round(Math.min(150, Math.max(72, Math.min(width.value * 0.15, height.value * 0.34)))))

const plot = computed(() => {
  const s = planeSize.value
  const left = 34
  const bottom = height.value - 22
  const right = Math.max(left + 40, width.value - s * 0.55)
  const top = Math.min(bottom - 40, s * 0.5)
  return { left, right, top, bottom, w: right - left, h: bottom - top }
})

const t = computed(() => (airborne.value ? elapsed.value : 0))
const m = computed(() => (airborne.value ? multiplier.value : 1))
const xMax = computed(() => Math.max(MIN_SECONDS, t.value / CRUISE_X))
const yMax = computed(() => Math.max(MIN_MULTIPLIER, 1 + (m.value - 1) / CRUISE_Y))

function toX(seconds: number) {
  const p = plot.value
  return p.left + (seconds / xMax.value) * p.w
}
function toY(mult: number) {
  const p = plot.value
  return p.bottom - ((mult - 1) / (yMax.value - 1)) * p.h
}

const SAMPLES = 64
const curve = computed(() => {
  if (!airborne.value || width.value === 0) return { line: '', fill: '' }
  const pts: string[] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const s = (t.value * i) / SAMPLES
    pts.push(`${toX(s).toFixed(1)},${toY(multiplierAt(s)).toFixed(1)}`)
  }
  const line = `M${pts.join(' L')}`
  const p = plot.value
  const fill = `${line} L${toX(t.value).toFixed(1)},${p.bottom} L${p.left},${p.bottom} Z`
  return { line, fill }
})

/** Heading of the curve at its tip, in degrees above horizontal. */
const heading = computed(() => {
  if (!airborne.value) return 0
  const p = plot.value
  const dx = p.w / xMax.value
  const dy = ((GROWTH * m.value) / (yMax.value - 1)) * p.h
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI
  return Math.min(55, Math.max(8, deg))
})

const tip = computed(() => ({ x: toX(t.value), y: toY(m.value) }))

const planeTransform = computed(() => {
  const s = planeSize.value
  const rad = (heading.value * Math.PI) / 180
  // Sit the plane just ahead of the curve's tip so the line reads as its exhaust trail.
  const ahead = s * 0.2
  let cx = tip.value.x + Math.cos(rad) * ahead
  let cy = tip.value.y - Math.sin(rad) * ahead
  let wobble = 0
  if (!airborne.value) {
    cy -= s * 0.12 // resting on the runway line
  } else if (flying.value) {
    // Gentle turbulence that fades in after lift-off.
    const amp = Math.min(1, t.value / 4)
    const now = performance.now() / 1000
    cy += Math.sin(now * 2.6) * s * 0.03 * amp
    cx += Math.cos(now * 1.7) * s * 0.012 * amp
    wobble = Math.sin(now * 2.1) * 1.6 * amp
  }
  // Turn the sprite from its own nose angle onto the curve's heading.
  const rotate = getCraft(props.craft).pitch - heading.value + wobble
  return `translate3d(${(cx - s / 2).toFixed(1)}px, ${(cy - s / 2).toFixed(1)}px, 0) rotate(${rotate.toFixed(2)}deg)`
})

// ---------- axes ----------

function pickStep(range: number, steps: number[], maxLines: number) {
  return steps.find((st) => range / st <= maxLines) ?? steps[steps.length - 1]!
}

const yTicks = computed(() => {
  const step = pickStep(yMax.value - 1, [0.2, 0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500], 4)
  const ticks: { v: number; y: number; label: string }[] = []
  for (let v = 1 + step; v <= yMax.value; v += step) {
    ticks.push({ v, y: toY(v), label: `${v < 10 ? v.toFixed(1) : v.toFixed(0)}x` })
  }
  return ticks
})

const xTicks = computed(() => {
  const step = pickStep(xMax.value, [2, 5, 10, 15, 30, 60, 120], 5)
  const ticks: { s: number; x: number }[] = []
  for (let s = step; s <= xMax.value; s += step) ticks.push({ s, x: toX(s) })
  return ticks
})

// ---------- markers ----------

const myCashOut = computed(() => {
  const r = gameStore.cashOutResult
  if (!r || !airborne.value) return null
  return { x: toX(secondsAt(r.cashOutMultiplier)), y: toY(r.cashOutMultiplier), label: `+${r.payout.toLocaleString()}` }
})

const otherCashOuts = computed(() =>
  airborne.value
    ? gameStore.roundBets
        .filter((b) => b.kind === 'cashout' && b.cashOutMultiplier)
        .map((b, i) => ({ key: `${b.playerId}-${i}`, x: toX(secondsAt(b.cashOutMultiplier!)), y: toY(b.cashOutMultiplier!) }))
    : [],
)

// ---------- waiting countdown ----------

const WAITING_SECONDS = 10
const countdownFraction = computed(() => Math.max(0, Math.min(1, (gameStore.countdownSeconds ?? 0) / WAITING_SECONDS)))

const multiplierClass = computed(() =>
  crashed.value
    ? 'text-danger [text-shadow:0_0_18px_color-mix(in_oklab,var(--neon-red)_90%,transparent)]'
    : gameStore.cashOutStatus === 'CashedOut'
      ? 'text-lime text-glow-lime'
      : 'text-electric text-glow-blue',
)
</script>

<template>
  <div ref="root" class="relative h-full w-full select-none overflow-hidden">
    <svg v-if="width > 0" class="absolute inset-0 h-full w-full" :viewBox="`0 0 ${width} ${height}`" aria-hidden="true">
      <defs>
        <linearGradient id="flight-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :style="{ stopColor: crashed ? 'var(--neon-red)' : 'var(--neon-magenta)', stopOpacity: 0.55 }" />
          <stop offset="100%" :style="{ stopColor: crashed ? 'var(--neon-red)' : 'var(--neon-magenta)', stopOpacity: 0.04 }" />
        </linearGradient>
        <linearGradient id="flight-line" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" style="stop-color: var(--neon-magenta)" />
          <stop offset="100%" style="stop-color: var(--neon-orange)" />
        </linearGradient>
      </defs>

      <!-- grid + axis labels -->
      <g class="font-arcade" style="font-size: 7px">
        <g v-for="tk in yTicks" :key="`y${tk.v}`">
          <line :x1="plot.left" :x2="width" :y1="tk.y" :y2="tk.y" style="stroke: var(--neon-violet); stroke-opacity: 0.18" stroke-dasharray="3 6" />
          <text :x="plot.left - 6" :y="tk.y + 3" text-anchor="end" style="fill: var(--muted-foreground)">{{ tk.label }}</text>
        </g>
        <g v-for="tk in xTicks" :key="`x${tk.s}`">
          <text :x="tk.x" :y="height - 6" text-anchor="middle" style="fill: var(--muted-foreground)">{{ tk.s }}s</text>
        </g>
      </g>
      <line :x1="plot.left" :x2="width" :y1="plot.bottom" :y2="plot.bottom" style="stroke: var(--neon-blue); stroke-opacity: 0.45" stroke-width="2" />
      <line :x1="plot.left" :x2="plot.left" :y1="0" :y2="plot.bottom" style="stroke: var(--neon-blue); stroke-opacity: 0.25" />

      <!-- the flight curve -->
      <template v-if="curve.line">
        <path :d="curve.fill" fill="url(#flight-fill)" />
        <path
          :d="curve.line"
          fill="none"
          :stroke="crashed ? 'var(--neon-red)' : 'url(#flight-line)'"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
          :style="{ filter: `drop-shadow(0 0 6px ${crashed ? 'var(--neon-red)' : 'var(--neon-magenta)'})` }"
        />
      </template>

      <!-- other pilots' cash-outs -->
      <circle v-for="c in otherCashOuts" :key="c.key" :cx="c.x" :cy="c.y" r="3.5" style="fill: var(--neon-violet); stroke: var(--background)" />

      <!-- my cash-out -->
      <g v-if="myCashOut">
        <circle :cx="myCashOut.x" :cy="myCashOut.y" r="6" style="fill: var(--neon-lime); filter: drop-shadow(0 0 6px var(--neon-lime))" />
        <text :x="myCashOut.x" :y="myCashOut.y - 12" text-anchor="middle" class="font-arcade" style="font-size: 9px; fill: var(--neon-lime)">
          {{ myCashOut.label }}
        </text>
      </g>
    </svg>

    <!-- aircraft riding the curve -->
    <div
      v-if="width > 0"
      class="pointer-events-none absolute left-0 top-0"
      :style="{ transform: planeTransform, willChange: 'transform', width: `${planeSize}px`, height: `${planeSize}px` }"
    >
      <!-- The curve is the exhaust trail here, so the sprite's own generic trail is off. -->
      <Plane :craft="props.craft" :size="planeSize" :idle="waiting" :crashing="crashed" :trail="false" />
    </div>
    <div
      v-if="crashed && width > 0"
      class="pointer-events-none absolute left-0 top-0 h-0 w-0"
      :style="{ transform: `translate3d(${tip.x}px, ${tip.y}px, 0)` }"
    >
      <Explosion :size="Math.round(planeSize * 1.6)" />
    </div>

    <!-- centre readout -->
    <div class="pointer-events-none absolute inset-x-0 top-[42%] flex -translate-y-1/2 flex-col items-center text-center">
      <template v-if="waiting">
        <p class="font-arcade text-[8px] uppercase tracking-[0.4em] text-muted-foreground">Next round in</p>
        <p class="font-arcade text-[clamp(2rem,9vmin,4.5rem)] leading-none text-ember text-glow-ember">
          {{ gameStore.countdownSeconds ?? '…' }}
        </p>
        <div class="mt-3 h-1.5 w-40 overflow-hidden border border-ember/50 bg-void/60 sm:w-56">
          <div class="h-full bg-[image:var(--grad-sunset)] transition-[width] duration-1000 ease-linear" :style="{ width: `${countdownFraction * 100}%` }" />
        </div>
      </template>
      <template v-else-if="airborne">
        <p
          :class="['font-arcade text-[clamp(2.5rem,11vmin,6rem)] leading-none tabular-nums', multiplierClass]"
        >
          {{ multiplier.toFixed(2) }}x
        </p>      </template>
      <p v-else class="font-arcade text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Connecting…</p>
      <slot name="readout" />
    </div>

    <slot />
  </div>
</template>
