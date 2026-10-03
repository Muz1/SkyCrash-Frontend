<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronLeft, ChevronRight, Users, Warehouse, Zap, X } from '@lucide/vue'
import ArcadeButton from './ArcadeButton.vue'
import { getCraft, CRAFTS } from '@/lib/craft'
import { useHangarStore } from '@/stores/hangarStore'

/**
 * Pre-flight briefing for first-time pilots: eight short cards, each with a small picture
 * made from the game's own pieces. Skippable at any point; replay it from the "?" button.
 */
const emit = defineEmits<{ close: [] }>()
const hangarStore = useHangarStore()
const plane = computed(() => getCraft(hangarStore.craftId))

type Step = { key: string; title: string; body: string }
const STEPS: Step[] = [
  {
    key: 'bet',
    title: 'Place your bet',
    body: 'Pick an amount with the quick chips or type one in, then press BET while the countdown runs. Bets close when the plane takes off.',
  },
  {
    key: 'multiplier',
    title: 'Watch the multiplier',
    body: 'Once you take off, the multiplier climbs from 1.00x. Your bet × the multiplier is what you win if you cash out right now.',
  },
  {
    key: 'flight',
    title: 'The flight',
    body: 'The higher the plane flies, the bigger the multiplier, but every flight crashes at a random point. Nobody knows when, not even us: each crash point is fixed by a secret seed before the round.',
  },
  {
    key: 'cashout',
    title: 'Cash out in time',
    body: 'Press CASH OUT (or Space) while the plane is still flying to bank your bet × the multiplier.',
  },
  {
    key: 'auto',
    title: 'Auto Cash Out',
    body: 'Switch Auto Cash Out ON and set a target like 2.00x. When the plane reaches it, you are cashed out for you, even if you look away. You can still press CASH OUT earlier yourself.',
  },
  {
    key: 'crash',
    title: 'If it crashes first',
    body: "If the plane crashes before you cash out, that bet is lost. Cash out early for a safe win, or hold on for a bigger one. It's your call.",
  },
  {
    key: 'lobby',
    title: 'Fly with friends',
    body: "Create a lobby or join one with a 6-character invite code. In the game you'll see your lobby-mates' planes, bets and cash-outs live, and only theirs.",
  },
  {
    key: 'hangar',
    title: 'Your hangar',
    body: 'Tap "Your plane" above the bet controls (or Hangar in the menu) to choose your aircraft and sky. Your lobby-mates see the plane you pick.',
  },
]

const index = ref(0)
const step = computed(() => STEPS[index.value]!)
const last = computed(() => index.value === STEPS.length - 1)
const dialog = ref<HTMLElement | null>(null)

function next() {
  if (last.value) emit('close')
  else index.value++
}
function back() {
  if (index.value > 0) index.value--
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') back()
}
onMounted(async () => {
  window.addEventListener('keydown', onKey)
  await nextTick()
  dialog.value?.focus()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="fixed inset-0 z-[90] grid place-items-center bg-void/80 p-4 backdrop-blur-sm">
    <section
      ref="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      tabindex="-1"
      class="neon-panel clip-hud relative w-full max-w-lg p-5 focus:outline-none sm:p-6"
    >
      <div class="flex items-center gap-3">
        <p class="font-arcade text-[0.5rem] uppercase tracking-[0.3em] text-ember">
          Pre-flight briefing · {{ index + 1 }}/{{ STEPS.length }}
        </p>
        <button
          type="button"
          class="ml-auto flex items-center gap-1.5 border-2 border-violet/60 px-2 py-1 font-arcade text-[0.5rem] uppercase tracking-[0.15em] text-foreground hover:border-magenta hover:text-magenta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
          @click="emit('close')"
        >
          <X class="h-3 w-3" aria-hidden="true" /> Skip tutorial
        </button>
      </div>

      <!-- picture for this step -->
      <div
        class="relative mt-4 grid h-40 place-items-center overflow-hidden border-2 border-violet/40 bg-deep/70"
        aria-hidden="true"
      >
        <template v-if="step.key === 'bet'">
          <div class="flex flex-col items-center gap-2">
            <div class="flex gap-1.5">
              <span
                v-for="v in ['100', '250', '500', '1K']"
                :key="v"
                :class="[
                  'clip-hud border-2 px-2.5 py-1 font-arcade text-[0.5625rem]',
                  v === '500'
                    ? 'border-ember text-ember [box-shadow:var(--glow-ember)]'
                    : 'border-violet/50 text-muted-foreground',
                ]"
                >{{ v }}</span
              >
            </div>
            <span
              class="clip-hud border-2 border-magenta bg-magenta/20 px-6 py-2 font-display text-sm font-black uppercase tracking-[0.2em] text-foreground"
              >Bet 500</span
            >
            <span class="font-arcade text-[0.5rem] uppercase tracking-[0.3em] text-muted-foreground"
              >Next round in 7s</span
            >
          </div>
        </template>
        <template v-else-if="step.key === 'multiplier'">
          <div class="text-center">
            <p class="font-arcade text-5xl text-electric text-glow-blue">2.37x</p>
            <p class="mt-2 text-sm text-foreground">
              500 bet × 2.37 = <span class="font-bold text-lime">1,185</span>
            </p>
          </div>
        </template>
        <template v-else-if="step.key === 'flight'">
          <svg viewBox="0 0 300 140" class="absolute inset-0 h-full w-full">
            <path
              d="M10,130 C120,128 200,100 250,30"
              fill="none"
              stroke="var(--neon-magenta)"
              stroke-width="4"
              style="filter: drop-shadow(0 0 6px var(--neon-magenta))"
            />
          </svg>
          <img
            :src="plane.src"
            alt=""
            class="tutorial-plane absolute h-16 w-16 object-contain"
            :style="{ transform: `rotate(${plane.rotate}deg)` }"
          />
        </template>
        <template v-else-if="step.key === 'cashout'">
          <div class="flex flex-col items-center gap-2">
            <p class="font-arcade text-3xl text-electric text-glow-blue">3.10x</p>
            <span
              class="clip-hud border-2 border-lime bg-lime/20 px-6 py-2 text-center font-display text-sm font-black uppercase tracking-[0.2em] text-foreground [box-shadow:var(--glow-lime)]"
            >
              Cash Out<br /><span class="font-arcade text-xs text-lime">+1,550</span>
            </span>
          </div>
        </template>
        <template v-else-if="step.key === 'auto'">
          <div
            class="clip-hud flex items-center gap-2 border-2 border-electric bg-electric/10 px-4 py-3 [box-shadow:var(--glow-blue)]"
          >
            <Zap class="h-5 w-5 text-electric" />
            <div>
              <p class="font-arcade text-[0.5625rem] uppercase tracking-[0.2em] text-electric">
                Auto Cash Out: On
              </p>
              <p class="mt-1 font-arcade text-lg text-electric">2.00x</p>
            </div>
          </div>
        </template>
        <template v-else-if="step.key === 'crash'">
          <div class="text-center">
            <p class="font-arcade text-4xl text-danger [text-shadow:0_0_16px_var(--neon-red)]">
              1.84x
            </p>
            <p class="mt-2 font-display text-sm font-black uppercase tracking-[0.25em] text-danger">
              Crashed! Bet lost
            </p>
          </div>
        </template>
        <template v-else-if="step.key === 'lobby'">
          <ul class="flex w-64 flex-col gap-1.5 text-sm">
            <li
              v-for="(p, i) in [
                { n: 'You', s: 'Flying 2.37x', c: 'text-electric' },
                { n: 'Pilot_Thandi', s: 'Cashed out 1.90x', c: 'text-lime' },
                { n: 'AceKhanyi', s: 'Ready', c: 'text-ember' },
              ]"
              :key="p.n"
              class="flex items-center gap-2 border border-violet/40 bg-void/70 px-2 py-1"
            >
              <img
                :src="CRAFTS[i % CRAFTS.length]!.src"
                alt=""
                class="h-5 w-5 object-contain"
                :style="{ transform: `rotate(${CRAFTS[i % CRAFTS.length]!.rotate}deg)` }"
              />
              <span class="font-semibold text-foreground">{{ p.n }}</span>
              <span :class="['ml-auto font-arcade text-[0.5rem] uppercase', p.c]">{{ p.s }}</span>
            </li>
          </ul>
          <Users class="absolute right-3 top-3 h-5 w-5 text-magenta" />
        </template>
        <template v-else>
          <div class="flex items-center gap-4">
            <img
              v-for="c in CRAFTS.slice(0, 3)"
              :key="c.id"
              :src="c.src"
              alt=""
              :class="[
                'h-14 w-14 object-contain',
                c.id === plane.id
                  ? 'scale-125 [filter:drop-shadow(0_0_10px_var(--neon-blue))]'
                  : 'opacity-60',
              ]"
              :style="{ transform: `rotate(${c.rotate}deg)` }"
            />
          </div>
          <Warehouse class="absolute right-3 top-3 h-5 w-5 text-electric" />
        </template>
      </div>

      <h2
        id="tutorial-title"
        class="mt-4 font-display text-xl font-black uppercase tracking-[0.12em] text-foreground sm:text-2xl"
      >
        {{ step.title }}
      </h2>
      <p class="mt-2 text-base leading-relaxed text-foreground/90" aria-live="polite">
        {{ step.body }}
      </p>

      <div class="mt-5 flex items-center gap-3">
        <button
          type="button"
          class="flex items-center gap-1 border-2 border-violet/50 px-3 py-2 font-arcade text-[0.5625rem] uppercase text-foreground disabled:opacity-30"
          :disabled="index === 0"
          @click="back"
        >
          <ChevronLeft class="h-3.5 w-3.5" aria-hidden="true" /> Back
        </button>
        <div class="flex flex-1 justify-center gap-1.5" aria-hidden="true">
          <span
            v-for="(_, i) in STEPS"
            :key="i"
            :class="[
              'h-1.5 w-4 transition-colors',
              i === index ? 'bg-ember' : i < index ? 'bg-magenta/70' : 'bg-violet/40',
            ]"
          />
        </div>
        <ArcadeButton type="button" size="md" :variant="last ? 'primary' : 'magenta'" @click="next">
          {{ last ? "Let's fly" : 'Next' }}
          <ChevronRight v-if="!last" class="h-4 w-4" aria-hidden="true" />
        </ArcadeButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tutorial-plane {
  animation: tutorial-climb 2.6s ease-in infinite;
}
@keyframes tutorial-climb {
  0% {
    left: 2%;
    top: 70%;
  }
  100% {
    left: 78%;
    top: 4%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .tutorial-plane {
    animation: none;
    left: 60%;
    top: 20%;
  }
}
</style>
