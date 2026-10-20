<script setup lang="ts">
import { computed } from 'vue'
import { getCraft } from '@/lib/craft'
import { useHangarStore } from '@/stores/hangarStore'
import type { TutorialStepKey } from '@/lib/tutorialSteps'

/**
 * One small looping picture per tutorial step, drawn with inline SVG/CSS from the game's own
 * pieces (the player's plane, the neon HUD). Decorative: the step's text carries the meaning.
 * `mini` is the landing-page strip size. Motion stops under prefers-reduced-motion.
 */
const props = withDefaults(defineProps<{ step: TutorialStepKey; mini?: boolean }>(), { mini: false })

const hangarStore = useHangarStore()
const plane = computed(() => getCraft(hangarStore.craftId))
// SMIL animations (the climb) ignore the CSS reduced-motion rules, so check it here too.
const reducedMotion = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const CLIMB_PATH = 'M8,132 C120,130 200,104 262,22'
</script>

<template>
  <div :class="['tut-ill relative h-full w-full overflow-hidden', mini && 'tut-ill--mini']" aria-hidden="true">
    <!-- 1. Credits: a coin stack and the balance readout -->
    <div v-if="props.step === 'credits'" class="grid h-full place-items-center">
      <div class="flex items-center gap-3">
        <svg viewBox="0 0 40 48" class="tut-coins h-[4.5rem] w-[3.75rem]" shape-rendering="crispEdges">
          <g v-for="i in 4" :key="i" :class="`tut-coin tut-coin-${i}`">
            <rect x="4" :y="40 - i * 9" width="32" height="8" fill="#facc15" />
            <rect x="4" :y="40 - i * 9" width="32" height="2" fill="#fef08a" />
            <rect x="4" :y="46 - i * 9" width="32" height="2" fill="#a16207" />
          </g>
        </svg>
        <div class="text-left">
          <p class="font-arcade text-[0.5rem] uppercase tracking-[0.2em] text-[#fde68a]">Credits</p>
          <p class="tut-balance font-arcade text-lg text-[#facc15] [text-shadow:0_0_10px_#facc15aa]">1,000</p>
        </div>
      </div>
    </div>

    <!-- 2. Bet: chips, then a tap on BET -->
    <div v-else-if="props.step === 'bet'" class="grid h-full place-items-center">
      <div class="flex flex-col items-center gap-2">
        <div class="flex gap-1.5">
          <span
            v-for="v in ['100', '250', '500']"
            :key="v"
            :class="[
              'clip-hud border-2 px-2 py-1 font-arcade text-[0.5rem]',
              v === '250' ? 'tut-chip border-ember text-ember' : 'border-violet/50 text-[#c4b5fd]',
            ]"
            >{{ v }}</span
          >
        </div>
        <span class="tut-press relative clip-hud border-2 border-[#fff7d6] bg-[image:var(--grad-sunset)] px-6 py-1.5 font-display text-sm font-black uppercase tracking-[0.2em] text-void">
          Bet 250
        </span>
        <span class="tut-tap pointer-events-none absolute left-1/2 top-[62%] h-8 w-8 -translate-x-1/2 rounded-full border-2 border-white" />
      </div>
    </div>

    <!-- 3. Climb: the curve draws, the plane rides it, the multiplier grows -->
    <div v-else-if="props.step === 'climb'" class="h-full">
      <!-- The curve and the plane share one path and one clock, so the plane rides the line. -->
      <svg viewBox="0 0 300 140" class="absolute inset-0 h-full w-full">
        <path
          class="tut-curve"
          :d="CLIMB_PATH"
          fill="none"
          stroke="var(--neon-magenta)"
          stroke-width="4"
          pathLength="100"
          stroke-dasharray="100"
          :stroke-dashoffset="reducedMotion ? 0 : 100"
        >
          <animate
            v-if="!reducedMotion"
            attributeName="stroke-dashoffset"
            values="100;0;0"
            keyTimes="0;0.85;1"
            dur="3s"
            repeatCount="indefinite"
          />
        </path>
        <g :transform="reducedMotion ? 'translate(262 22)' : undefined">
          <image
            :href="plane.src"
            x="-22"
            y="-22"
            width="44"
            height="44"
            :transform="`rotate(${plane.rotate})`"
            style="image-rendering: pixelated"
          />
          <animateMotion
            v-if="!reducedMotion"
            :path="CLIMB_PATH"
            keyPoints="0;1;1"
            keyTimes="0;0.85;1"
            calcMode="linear"
            dur="3s"
            repeatCount="indefinite"
          />
        </g>
      </svg>
      <p class="tut-mult absolute left-3 top-2 font-arcade text-2xl text-electric text-glow-blue">2.37x</p>
    </div>

    <!-- 4. Cash out: a tap on CASH OUT and the win floats up -->
    <div v-else-if="props.step === 'cashout'" class="grid h-full place-items-center">
      <div class="relative flex flex-col items-center gap-2">
        <span class="tut-win absolute -top-1 font-arcade text-sm text-lime text-glow-lime">+775</span>
        <p class="mt-5 font-arcade text-xl text-electric text-glow-blue">3.10x</p>
        <span class="tut-press clip-hud border-2 border-lime bg-lime/20 px-5 py-1.5 font-display text-sm font-black uppercase tracking-[0.18em] text-foreground [box-shadow:var(--glow-lime)]">
          Cash Out
        </span>
        <span class="tut-tap pointer-events-none absolute bottom-0 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full border-2 border-white" />
      </div>
    </div>

    <!-- 5. Crash: the plane blows up and the bet is gone -->
    <div v-else class="grid h-full place-items-center">
      <div class="relative grid place-items-center">
        <svg viewBox="0 0 48 48" class="tut-boom absolute h-24 w-24" shape-rendering="crispEdges">
          <g fill="#ff5a3c">
            <rect x="22" y="2" width="4" height="10" /><rect x="22" y="36" width="4" height="10" />
            <rect x="2" y="22" width="10" height="4" /><rect x="36" y="22" width="10" height="4" />
            <rect x="8" y="8" width="6" height="6" /><rect x="34" y="8" width="6" height="6" />
            <rect x="8" y="34" width="6" height="6" /><rect x="34" y="34" width="6" height="6" />
          </g>
          <rect x="16" y="16" width="16" height="16" fill="#fde047" />
          <rect x="20" y="20" width="8" height="8" fill="#fff" />
        </svg>
        <img
          :src="plane.src"
          alt=""
          class="tut-crash-plane h-12 w-12 object-contain"
          :style="{ transform: `rotate(${plane.rotate}deg)` }"
        />
        <p class="tut-crashed relative mt-16 font-display text-sm font-black uppercase tracking-[0.2em] text-[#ff6b5a] [text-shadow:0_0_12px_#ff3b3b]">
          Crashed 1.84x
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tut-ill--mini {
  transform-origin: center;
}
.tut-ill--mini > * {
  transform: scale(0.55);
}

/* credits */
.tut-coin {
  animation: tut-coin-drop 2.8s ease-out infinite;
}
.tut-coin-2 {
  animation-delay: 0.15s;
}
.tut-coin-3 {
  animation-delay: 0.3s;
}
.tut-coin-4 {
  animation-delay: 0.45s;
}
@keyframes tut-coin-drop {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  20%,
  100% {
    opacity: 1;
    transform: none;
  }
}
.tut-balance {
  animation: tut-pulse 2.8s ease-in-out infinite;
}

/* shared tap: button squashes while a ring spreads */
.tut-press {
  animation: tut-press 2.4s ease-in-out infinite;
}
@keyframes tut-press {
  0%,
  45%,
  60%,
  100% {
    transform: none;
    filter: none;
  }
  50% {
    transform: translateY(2px) scale(0.96);
    filter: brightness(1.3);
  }
}
.tut-tap {
  opacity: 0;
  animation: tut-tap 2.4s ease-out infinite;
}
@keyframes tut-tap {
  0%,
  45% {
    opacity: 0;
    transform: translateX(-50%) scale(0.4);
  }
  50% {
    opacity: 0.9;
  }
  75%,
  100% {
    opacity: 0;
    transform: translateX(-50%) scale(1.8);
  }
}
.tut-chip {
  box-shadow: var(--glow-ember);
}

/* climb */
.tut-curve {
  filter: drop-shadow(0 0 5px var(--neon-magenta));
}
.tut-mult {
  transform-origin: left top;
  animation: tut-grow 3s ease-in infinite;
}
@keyframes tut-grow {
  0% {
    transform: scale(0.6);
    opacity: 0.6;
  }
  85%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* cash out */
.tut-win {
  opacity: 0;
  animation: tut-float 2.4s ease-out infinite;
}
@keyframes tut-float {
  0%,
  50% {
    opacity: 0;
    transform: translateY(10px);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-8px);
  }
}

/* crash */
.tut-crash-plane {
  animation: tut-crash-plane 2.6s ease-in infinite;
}
@keyframes tut-crash-plane {
  0%,
  40% {
    opacity: 1;
    translate: -30px 10px;
  }
  55% {
    opacity: 1;
    translate: 0 0;
  }
  60%,
  100% {
    opacity: 0;
    translate: 0 0;
  }
}
.tut-boom {
  opacity: 0;
  animation: tut-boom 2.6s ease-out infinite;
}
@keyframes tut-boom {
  0%,
  55% {
    opacity: 0;
    transform: scale(0.3);
  }
  62% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.3);
  }
}
.tut-crashed {
  animation: tut-pulse 2.6s steps(2) infinite;
}
@keyframes tut-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}

/* Still pictures for players who prefer less motion: show each step's end state. */
@media (prefers-reduced-motion: reduce) {
  .tut-ill * {
    animation: none !important;
  }
  .tut-win,
  .tut-boom {
    opacity: 1;
  }
  .tut-tap,
  .tut-crash-plane {
    opacity: 0;
  }
}
</style>
