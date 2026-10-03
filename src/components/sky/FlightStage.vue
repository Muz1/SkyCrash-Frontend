<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useFlightClock, multiplierAt, secondsAt, GROWTH } from '@/composables/useFlightClock'
import { getCraft, type CraftId } from '@/lib/craft'
import Plane from './Plane.vue'
import Explosion from './Explosion.vue'
import { soundEngine } from '@/lib/soundEngine'
import type { FlightRow } from '@/composables/useLobbyFlight'

/**
 * Crash-game flight. Time runs left to right, multiplier upwards, and the curve
 * is the same e^(GROWTH·t) the server uses, so the plane at its tip is always
 * exactly where the multiplier says it is. The scale starts fixed (the plane
 * climbs up and to the right), then rescales once it reaches its cruising spot
 * near the top-right so it holds position while the curve compresses behind.
 * No axes or grid are drawn — just the sky, the trail and the plane. Neon
 * checkpoint rings wait ahead at milestone multipliers (2x, 5x, 10x…); the plane
 * flies through each one with a flash and a chime, and passed rings stay on the trail.
 */
const props = withDefaults(defineProps<{ craft: CraftId; wingmen?: FlightRow[] }>(), { wingmen: () => [] })

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
  const left = Math.max(16, s * 0.25)
  const bottom = height.value - 14
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

// ---------- markers ----------

const myCashOut = computed(() => {
  const r = gameStore.cashOutResult
  if (!r || !airborne.value) return null
  return { x: toX(secondsAt(r.cashOutMultiplier)), y: toY(r.cashOutMultiplier), label: `+${r.payout.toLocaleString()}` }
})

// ---------- lobby-mates ----------
// Every lobby-mate flies in formation behind my plane, whether or not they bet this round
// (they share the round, so they're always at the same multiplier). One who bet and cashed
// out peels off and is parked at their cash-out point; the rest go down with the crash.

const wingSize = computed(() => Math.round(planeSize.value * 0.42))

function craftRotation(id: CraftId) {
  const c = getCraft(id)
  return c.rotate + c.pitch - heading.value
}

const formation = computed(() => {
  const s = planeSize.value
  const p = plot.value
  const rows = props.wingmen.filter((w) => w.status !== 'cashed' && w.status !== 'crashed')
  if (waiting.value) {
    // Lined up on the runway ahead of me, waiting for take-off.
    return rows.map((w, i) => ({
      w,
      x: Math.min(p.right, p.left + s * 0.75 + i * wingSize.value * 1.15),
      y: p.bottom - wingSize.value * 0.35,
      rotate: getCraft(w.craftId).rotate + getCraft(w.craftId).pitch,
    }))
  }
  if (!flying.value) return []
  const rad = (heading.value * Math.PI) / 180
  const dir = { x: Math.cos(rad), y: -Math.sin(rad) }
  const perp = { x: Math.sin(rad), y: Math.cos(rad) }
  const centre = planeCentre()
  const now = performance.now() / 1000
  return rows.map((w, i) => {
    const rank = Math.floor(i / 2) + 1
    const side = i % 2 === 0 ? 1 : -0.55
    const back = rank * s * 0.55
    const off = side * rank * s * 0.3
    const bob = Math.sin(now * 2.2 + i) * s * 0.02
    return {
      w,
      x: Math.max(p.left, Math.min(width.value - wingSize.value / 2, centre.x - dir.x * back + perp.x * off)),
      y: Math.max(wingSize.value / 2, Math.min(p.bottom, centre.y - dir.y * back + perp.y * off + bob)),
      rotate: craftRotation(w.craftId),
    }
  })
})

const parked = computed(() =>
  airborne.value
    ? props.wingmen
        .filter((w) => w.status === 'cashed' && w.cashOutMultiplier)
        .map((w) => ({ w, x: toX(secondsAt(w.cashOutMultiplier!)), y: toY(w.cashOutMultiplier!) }))
    : [],
)

// ---------- checkpoint rings ----------

/** Milestone multipliers the plane flies through. */
const CHECKPOINTS = [2, 3, 5, 10, 25, 50, 100, 250, 500, 1000]
/** The next ring comes into view this many seconds of flight before the plane reaches it. */
const RING_LOOKAHEAD_S = 4
const BURST_MS = 900

function ringTone(cp: number) {
  if (cp < 3) return 'var(--neon-blue)'
  if (cp < 10) return 'var(--neon-lime)'
  if (cp < 50) return 'var(--neon-magenta)'
  return 'var(--neon-orange)'
}

const ringRadius = computed(() => planeSize.value * 0.55)

/** Where the plane's centre sits: just ahead of the curve tip, along its heading. */
function planeCentre() {
  const rad = (heading.value * Math.PI) / 180
  const ahead = planeSize.value * 0.2
  return { x: tip.value.x + Math.cos(rad) * ahead, y: tip.value.y - Math.sin(rad) * ahead }
}

const upcomingRing = computed(() => {
  if (!flying.value) return null
  const cp = CHECKPOINTS.find((c) => c > m.value)
  if (cp === undefined) return null
  const away = secondsAt(cp) - t.value
  if (away > RING_LOOKAHEAD_S) return null
  // 0 when it first appears far ahead, 1 when the plane reaches it.
  const progress = 1 - away / RING_LOOKAHEAD_S
  const rad = (heading.value * Math.PI) / 180
  const centre = planeCentre()
  const room = Math.max(planeSize.value, width.value - centre.x - ringRadius.value * 0.4)
  const dist = (1 - progress) * room
  return {
    cp,
    x: centre.x + Math.cos(rad) * dist,
    y: centre.y - Math.sin(rad) * dist,
    scale: 0.55 + 0.45 * progress,
    opacity: Math.min(1, progress * 3),
    tone: ringTone(cp),
  }
})

/** Rings already flown through, pinned to the trail at their multiplier. */
const passedRings = computed(() =>
  airborne.value
    ? CHECKPOINTS.filter((c) => c <= m.value).map((cp) => ({ cp, x: toX(secondsAt(cp)), y: toY(cp), tone: ringTone(cp) }))
    : [],
)

const bursts = ref<{ id: number; cp: number; x: number; y: number; tone: string }[]>([])
let burstId = 0
// Start from whatever's already been passed, so joining mid-round doesn't replay old rings.
let lastPassed = Math.max(0, ...CHECKPOINTS.filter((c) => c <= m.value))

watch(m, (value) => {
  if (!flying.value) return
  const passed = CHECKPOINTS.filter((c) => c <= value && c > lastPassed)
  if (passed.length === 0) return
  lastPassed = passed[passed.length - 1]!
  const centre = planeCentre()
  for (const cp of passed) {
    const id = ++burstId
    bursts.value.push({ id, cp, x: centre.x, y: centre.y, tone: ringTone(cp) })
    setTimeout(() => (bursts.value = bursts.value.filter((b) => b.id !== id)), BURST_MS)
    soundEngine.checkpoint(CHECKPOINTS.indexOf(cp))
  }
})

watch(
  () => gameStore.phase,
  (phase) => {
    if (phase === 'Running') lastPassed = 0
    else bursts.value = []
  },
)

/** One half of a ring seen side-on; the plane flies between the two halves. */
function ringArc(side: 'back' | 'front') {
  const ry = ringRadius.value
  const rx = ry * 0.32
  return `M0,${-ry} A${rx},${ry} 0 0 ${side === 'back' ? 0 : 1} 0,${ry}`
}

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

      <!-- checkpoint rings already flown through -->
      <g v-for="r in passedRings" :key="`passed-${r.cp}`">
        <circle :cx="r.x" :cy="r.y" r="7" fill="none" stroke-width="2" :style="{ stroke: r.tone, filter: `drop-shadow(0 0 4px ${r.tone})` }" />
        <text :x="r.x" :y="r.y + 20" text-anchor="middle" class="font-arcade" :style="{ fontSize: '8px', fill: r.tone }">{{ r.cp }}x</text>
      </g>

      <!-- far half of the next ring (drawn behind the plane) -->
      <g
        v-if="upcomingRing"
        :transform="`translate(${upcomingRing.x.toFixed(1)} ${upcomingRing.y.toFixed(1)}) rotate(${-heading}) scale(${upcomingRing.scale.toFixed(3)})`"
        :style="{ opacity: upcomingRing.opacity }"
      >
        <path :d="ringArc('back')" fill="none" stroke-width="7" stroke-linecap="round" :style="{ stroke: upcomingRing.tone, strokeOpacity: 0.55 }" />
      </g>

      <!-- lobby-mates' cash-out points -->
      <g v-for="c in parked" :key="`parked-${c.w.playerId}`">
        <circle :cx="c.x" :cy="c.y" r="4" style="fill: var(--neon-lime); stroke: var(--background)" />
      </g>

      <!-- my cash-out -->
      <g v-if="myCashOut">
        <circle :cx="myCashOut.x" :cy="myCashOut.y" r="6" style="fill: var(--neon-lime); filter: drop-shadow(0 0 6px var(--neon-lime))" />
        <text :x="myCashOut.x" :y="myCashOut.y - 12" text-anchor="middle" class="font-arcade" style="font-size: 9px; fill: var(--neon-lime)">
          {{ myCashOut.label }}
        </text>
      </g>
    </svg>

    <!-- lobby-mates: in formation while flying, parked where they cashed out -->
    <div
      v-for="f in formation"
      :key="`wing-${f.w.playerId}`"
      class="pointer-events-none absolute left-0 top-0"
      :style="{ transform: `translate3d(${(f.x - wingSize / 2).toFixed(1)}px, ${(f.y - wingSize / 2).toFixed(1)}px, 0)`, width: `${wingSize}px` }"
    >
      <img
        :src="getCraft(f.w.craftId).src"
        alt=""
        width="1024"
        height="1024"
        class="h-auto w-full object-contain opacity-80 [filter:drop-shadow(0_0_6px_var(--neon-violet))]"
        :style="{ transform: `rotate(${f.rotate.toFixed(1)}deg)` }"
      />
      <span class="absolute left-1/2 top-full max-w-24 -translate-x-1/2 truncate whitespace-nowrap border border-violet/50 bg-void/80 px-1 font-arcade text-[0.4375rem] uppercase text-foreground">
        {{ f.w.username }}
      </span>
    </div>
    <div
      v-for="c in parked"
      :key="`parked-label-${c.w.playerId}`"
      class="pointer-events-none absolute left-0 top-0"
      :style="{ transform: `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0)` }"
    >
      <span class="absolute bottom-2 left-0 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap border border-lime/60 bg-void/85 px-1 py-0.5 font-arcade text-[0.4375rem] uppercase text-lime">
        <img :src="getCraft(c.w.craftId).src" alt="" width="1024" height="1024" class="h-3.5 w-3.5 object-contain" />
        {{ c.w.username }} {{ c.w.cashOutMultiplier?.toFixed(2) }}x
      </span>
    </div>

    <!-- aircraft riding the curve -->
    <div
      v-if="width > 0"
      class="pointer-events-none absolute left-0 top-0"
      :style="{ transform: planeTransform, willChange: 'transform', width: `${planeSize}px`, height: `${planeSize}px` }"
    >
      <!-- The curve is the exhaust trail here, so the sprite's own generic trail is off. -->
      <Plane :craft="props.craft" :size="planeSize" :idle="waiting" :crashing="crashed" :trail="false" />
    </div>
    <!-- near half of the next ring + pass-through flashes (drawn in front of the plane) -->
    <svg v-if="width > 0" class="pointer-events-none absolute inset-0 h-full w-full" :viewBox="`0 0 ${width} ${height}`" aria-hidden="true">
      <g v-if="upcomingRing" :style="{ opacity: upcomingRing.opacity }">
        <g :transform="`translate(${upcomingRing.x.toFixed(1)} ${upcomingRing.y.toFixed(1)}) rotate(${-heading}) scale(${upcomingRing.scale.toFixed(3)})`">
          <path
            :d="ringArc('front')"
            fill="none"
            stroke-width="7"
            stroke-linecap="round"
            :style="{ stroke: upcomingRing.tone, filter: `drop-shadow(0 0 8px ${upcomingRing.tone})` }"
          />
        </g>
        <text
          :x="upcomingRing.x"
          :y="upcomingRing.y - ringRadius * upcomingRing.scale - 10"
          text-anchor="middle"
          class="font-arcade"
          :style="{ fontSize: '11px', fill: upcomingRing.tone, filter: `drop-shadow(0 0 6px ${upcomingRing.tone})` }"
        >
          {{ upcomingRing.cp }}x
        </text>
      </g>
    </svg>
    <div
      v-for="b in bursts"
      :key="b.id"
      class="checkpoint-burst pointer-events-none absolute left-0 top-0"
      :style="{ transform: `translate3d(${b.x}px, ${b.y}px, 0)`, '--tone': b.tone, '--size': `${Math.round(ringRadius * 2)}px` }"
    >
      <span class="checkpoint-burst__ring" />
      <span class="checkpoint-burst__label font-arcade">{{ b.cp }}x</span>
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
        <p class="font-arcade text-[0.5rem] uppercase tracking-[0.4em] text-muted-foreground">Next round in</p>
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
      <p v-else class="font-arcade text-[0.625rem] uppercase tracking-[0.4em] text-muted-foreground">Connecting…</p>
      <slot name="readout" />
    </div>

    <slot />
  </div>
</template>

<style scoped>
.checkpoint-burst__ring {
  position: absolute;
  left: calc(var(--size) / -2);
  top: calc(var(--size) / -2);
  width: var(--size);
  height: var(--size);
  border: 4px solid var(--tone);
  border-radius: 9999px;
  box-shadow: 0 0 18px var(--tone), inset 0 0 18px var(--tone);
  animation: checkpoint-ring 900ms ease-out forwards;
}
.checkpoint-burst__label {
  position: absolute;
  left: 0;
  top: calc(var(--size) / -2);
  transform: translate(-50%, -100%);
  font-size: 18px;
  color: var(--tone);
  text-shadow: 0 0 12px var(--tone);
  white-space: nowrap;
  animation: checkpoint-label 900ms ease-out forwards;
}
@keyframes checkpoint-ring {
  from {
    transform: scale(0.6);
    opacity: 1;
  }
  to {
    transform: scale(1.9);
    opacity: 0;
  }
}
@keyframes checkpoint-label {
  0% {
    transform: translate(-50%, -100%) scale(0.6);
    opacity: 0;
  }
  25% {
    transform: translate(-50%, -110%) scale(1.15);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -190%) scale(1);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .checkpoint-burst__ring,
  .checkpoint-burst__label {
    animation-duration: 1ms;
  }
}
</style>
