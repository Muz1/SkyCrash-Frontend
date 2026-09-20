<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import CRTOverlay from "@/components/sky/CRTOverlay.vue";
import CreditDisplay from "@/components/sky/CreditDisplay.vue";
import NeonPanel from "@/components/sky/NeonPanel.vue";
import ArcadeButton from "@/components/sky/ArcadeButton.vue";
import SkyEnvironment from "@/components/sky/SkyEnvironment.vue";
import Ambient from "@/components/sky/Ambient.vue";
import Plane from "@/components/sky/Plane.vue";
import Explosion from "@/components/sky/Explosion.vue";
import NavDock from "@/components/sky/NavDock.vue";
import Wordmark from "@/components/sky/Wordmark.vue";
import MuteButton from "@/components/sky/MuteButton.vue";
import { useAuthStore } from "@/stores/auth";
import { useHangarStore } from "@/stores/hangar";
import { useRoundStore } from "@/stores/round";
import { useSoundStore } from "@/stores/sound";
import { getCraft } from "@/lib/craft";

const auth = useAuthStore();
const hangar = useHangarStore();
const round = useRoundStore();
const sound = useSoundStore();

const BET_STEPS = [100, 250, 500, 1000, 2000, 5000] as const;
function formatBet(v: number) {
  return v >= 1000 ? `${v / 1000}K` : `${v}`;
}

const credits = computed(() => auth.player?.creditBalance ?? 0);
const craftInfo = computed(() => getCraft(hangar.craftId));

const bet = ref(250);

const hasBet = computed(() => round.myBetId !== null);
const hasCashedOut = computed(() => round.myCashOut !== null);

type Phase = "betting" | "launching" | "flying" | "cashed" | "crashed";

const phase = computed<Phase>(() => {
  if (hasCashedOut.value) return "cashed";
  if (round.status === "Crashed") return "crashed";
  if (round.status === "Running") return "flying";
  if (round.status === "Waiting") return hasBet.value ? "launching" : "betting";
  return "betting";
});

const flying = computed(() => phase.value === "flying");
const airborne = computed(() => phase.value !== "betting" && phase.value !== "launching");
const climb = computed(() => Math.min((round.multiplier - 1) / 8, 1));
const takeoffCurve = computed(() => Math.pow(climb.value, 1.85));
const ascent = computed(() => (airborne.value ? climb.value : 0));
const potential = computed(() => Math.round((round.myBetAmount ?? bet.value) * round.multiplier));

// Sizes the aircraft sprite as a fraction of the flight-stage panel's actual (viewport-driven) height,
// not a fixed pixel size — otherwise a tall multiplier climb can push the sprite past the panel's own
// top edge and get clipped by its overflow-hidden bound.
const viewportHeight = ref(typeof window === "undefined" ? 800 : window.innerHeight);
function updateViewportHeight() {
  viewportHeight.value = window.innerHeight;
}
onMounted(() => window.addEventListener("resize", updateViewportHeight));
onUnmounted(() => window.removeEventListener("resize", updateViewportHeight));
// Mirrors the flight stage's `h-[clamp(200px,42vh,420px)]` so sizing stays proportional to it.
const flightStageHeight = computed(() => Math.min(420, Math.max(200, viewportHeight.value * 0.42)));
const planeSize = computed(() => Math.round(flightStageHeight.value * 0.34));

function selectBet(v: number) {
  sound.playSelect();
  bet.value = v;
}

function selectMaxBet() {
  sound.playSelect();
  bet.value = Math.floor(credits.value);
}

function placeBet() {
  if (bet.value > credits.value) return;
  round.placeBet(bet.value);
}

function cashOut() {
  round.cashOut();
}

watch(
  () => round.status,
  (status, previous) => {
    if (status === "Running" && previous !== "Running") {
      sound.playTakeoff();
    }
  },
);
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-void">
    <!-- Camera layer — the whole world bounces, not just the UI -->
    <div
      class="absolute inset-0"
      :style="{
        animation:
          phase === 'crashed'
            ? 'camera-impact 900ms cubic-bezier(0.3,0,0.2,1) both'
            : flying
              ? `camera-climb ${Math.max(0.9, 2.4 - climb * 1.4)}s ease-in-out infinite`
              : 'camera-idle 7s ease-in-out infinite',
        willChange: 'transform',
      }"
    >
      <SkyEnvironment :skin="hangar.skinId" :progress="ascent" :dim="phase === 'crashed' ? 0.5 : 0.34" />
      <Ambient :skin="hangar.skinId" :progress="ascent" />
    </div>
    <CRTOverlay />

    <!-- HUD -->
    <header class="relative z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-8">
      <div class="min-w-0">
        <Wordmark compact />
      </div>
      <div class="flex items-center gap-2 justify-self-end">
        <MuteButton />
        <CreditDisplay :credits="credits" />
      </div>
    </header>

    <main class="relative z-10 mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col items-center px-4 pb-44">
      <!-- Multiplier -->
      <div class="relative mt-2 text-center">
        <p class="font-arcade text-[8px] uppercase tracking-[0.5em] text-muted-foreground">Multiplier</p>
        <p
          class="font-arcade text-5xl leading-none sm:text-7xl"
          :class="
            phase === 'crashed'
              ? 'text-danger [text-shadow:0_0_18px_color-mix(in_oklab,var(--neon-red)_90%,transparent)]'
              : phase === 'cashed'
                ? 'text-lime text-glow-lime'
                : 'text-electric text-glow-blue'
          "
          :style="{ animation: flying ? 'multiplier-tick 220ms ease-out' : undefined }"
        >
          {{ round.multiplier.toFixed(2) }}x
        </p>
      </div>

      <!-- Flight stage — canonical 45° bottom-left → top-right trajectory, always bounded to this panel -->
      <div class="relative h-[clamp(200px,42vh,420px)] w-full overflow-hidden">
        <div
          aria-hidden="true"
          class="absolute bottom-[10%] left-[6%] h-[2px] w-[76%] origin-left -rotate-45 opacity-25"
          style="background: repeating-linear-gradient(90deg, color-mix(in oklab, var(--neon-blue) 60%, transparent) 0 12px, transparent 12px 26px)"
        />
        <div
          class="absolute transition-[left,bottom] duration-500 ease-out"
          :style="{
            left: `${6 + climb * 62}%`,
            bottom: `${6 + takeoffCurve * 58}%`,
            willChange: 'left, bottom',
          }"
        >
          <div
            class="origin-bottom-left transition-transform duration-500 ease-out"
            :style="{ transform: `translate(-30%, 20%) scale(${1 + climb * 0.12})` }"
          >
            <Plane :size="planeSize" :crashing="phase === 'crashed'" :trail="airborne" :trail-intensity="0.6 + climb" />
            <div v-if="phase === 'cashed'" aria-hidden="true" class="pointer-events-none absolute inset-0">
              <span
                v-for="i in 14"
                :key="i"
                class="absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-[image:var(--grad-sunset)]"
                :style="{
                  '--dx': `${(i % 2 ? 1 : -1) * (30 + i * 12)}px`,
                  '--dy': `${-60 - (i % 5) * 26}px`,
                  animation: `coin-fly 1s ease-out ${i * 40}ms forwards`,
                }"
              />
            </div>
            <div v-if="phase === 'crashed'" class="absolute left-1/2 top-1/2">
              <Explosion :size="300" />
            </div>
          </div>
        </div>

        <div v-if="phase === 'launching'" class="absolute inset-x-0 bottom-6 text-center">
          <p class="font-arcade text-[9px] uppercase tracking-[0.3em] text-ember animate-sky-pulse">
            {{ craftInfo.name }} spooling up… ({{ round.countdownSeconds }}s)
          </p>
          <div class="mx-auto mt-3 h-2 w-56 border border-ember/60 clip-hud">
            <div class="h-full bg-[image:var(--grad-sunset)]" style="animation: sky-pulse 1.4s linear infinite; width: 70%" />
          </div>
        </div>
      </div>

      <!-- Result overlays -->
      <div v-if="phase === 'cashed'" class="animate-sky-pop neon-panel clip-hud w-full max-w-md p-6 text-center">
        <p class="font-display text-sm font-black uppercase tracking-[0.3em] text-lime text-glow-lime">Cashed Out</p>
        <p class="mt-3 font-arcade text-3xl text-lime text-glow-lime">
          +{{ Math.round(round.myCashOut?.payout ?? 0).toLocaleString() }}
        </p>
        <p class="font-arcade text-[8px] uppercase tracking-[0.4em] text-ember">Credits</p>
        <p class="mt-4 font-arcade text-[8px] uppercase tracking-[0.3em] text-muted-foreground">
          Next flight starts automatically
        </p>
      </div>

      <div
        v-else-if="phase === 'crashed' && hasBet"
        class="animate-sky-pop neon-panel clip-hud w-full max-w-md border-danger/70 p-6 text-center"
      >
        <p class="font-display text-xl font-black uppercase tracking-[0.24em] text-danger [text-shadow:0_0_16px_color-mix(in_oklab,var(--neon-red)_85%,transparent)]">
          Flight Over
        </p>
        <p class="mt-4 font-arcade text-[8px] uppercase tracking-[0.4em] text-muted-foreground">Crashed at</p>
        <p class="font-arcade text-3xl text-ember text-glow-ember">{{ (round.crashMultiplier ?? 0).toFixed(2) }}x</p>
        <div class="mt-6 flex flex-col gap-3">
          <RouterLink to="/hangar">
            <ArcadeButton size="sm" variant="ghost" class="w-full">Return To Hangar</ArcadeButton>
          </RouterLink>
        </div>
      </div>
    </main>

    <!-- Bottom controls -->
    <div class="fixed inset-x-0 bottom-24 z-20 px-4 sm:bottom-28">
      <div class="mx-auto w-full max-w-4xl">
        <NeonPanel v-if="phase === 'betting'" accent="magenta" class="w-full">
          <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div class="min-w-0">
              <p class="font-display text-lg font-black uppercase tracking-[0.2em] text-magenta text-glow-magenta">
                New Flight
              </p>
              <p class="text-xs uppercase tracking-[0.28em] text-muted-foreground">Place your bet</p>

              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="v in BET_STEPS"
                  :key="v"
                  class="clip-hud border-2 px-3 py-1.5 font-arcade text-[9px] transition-all duration-150 active:translate-y-[1px]"
                  :class="
                    bet === v
                      ? 'border-ember text-ember [box-shadow:var(--glow-ember)]'
                      : 'border-violet/50 text-muted-foreground hover:border-electric hover:text-electric'
                  "
                  @click="selectBet(v)"
                >
                  {{ formatBet(v) }}
                </button>
                <button
                  class="clip-hud border-2 border-magenta/60 px-3 py-1.5 font-arcade text-[9px] text-magenta transition-all hover:[box-shadow:var(--glow-magenta)]"
                  @click="selectMaxBet"
                >
                  Max
                </button>
              </div>

              <div class="mt-4 flex flex-wrap items-center gap-4">
                <div>
                  <p class="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">Bet Amount</p>
                  <p class="font-arcade text-xl text-ember text-glow-ember">{{ bet.toLocaleString() }}</p>
                </div>
              </div>

              <p v-if="round.betRejectedMessage" role="alert" class="mt-3 font-arcade text-[8px] uppercase text-danger">
                {{ round.betRejectedMessage }}
              </p>
              <p v-if="credits <= 0" class="mt-3 font-arcade text-[8px] uppercase text-ember">
                Out of credits —
                <RouterLink to="/credits" class="text-lime hover:text-glow-lime">claim a demo top-up</RouterLink>
              </p>
            </div>

            <div class="flex flex-col gap-2">
              <ArcadeButton size="xl" variant="primary" :disabled="bet > credits || credits <= 0" @click="placeBet">
                Place Bet
              </ArcadeButton>
              <RouterLink to="/hangar">
                <ArcadeButton size="sm" variant="blue" class="w-full">Hangar · {{ craftInfo.name }}</ArcadeButton>
              </RouterLink>
              <RouterLink to="/credits">
                <ArcadeButton size="sm" variant="ghost" class="w-full">Get Credits</ArcadeButton>
              </RouterLink>
            </div>
          </div>
        </NeonPanel>

        <div v-else-if="flying && !hasCashedOut" class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:gap-5">
          <div class="neon-panel clip-hud px-4 py-3">
            <p class="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">Bet</p>
            <p class="font-arcade text-base text-ember text-glow-ember">
              {{ (round.myBetAmount ?? 0).toLocaleString() }}
            </p>
          </div>
          <ArcadeButton
            v-if="hasBet"
            variant="cash"
            size="xl"
            class="w-full flex-col !gap-0 py-5"
            @click="cashOut"
          >
            <span>Cash Out</span>
            <span class="font-arcade text-base sm:text-xl">+{{ potential.toLocaleString() }}</span>
          </ArcadeButton>
          <p v-if="round.cashOutRejectedMessage" role="alert" class="col-span-2 mt-1 font-arcade text-[8px] uppercase text-danger">
            {{ round.cashOutRejectedMessage }}
          </p>
        </div>
      </div>
    </div>

    <NavDock />
  </div>
</template>
