<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useHangarStore } from '@/stores/hangarStore'
import * as gameService from '@/services/gameService'
import { BET_STEPS, formatBet } from '@/lib/betSteps'
import SkyEnvironment from '@/components/sky/SkyEnvironment.vue'
import Ambient from '@/components/sky/Ambient.vue'
import CRTOverlay from '@/components/sky/CRTOverlay.vue'
import Plane from '@/components/sky/Plane.vue'
import Explosion from '@/components/sky/Explosion.vue'
import NavDock from '@/components/sky/NavDock.vue'
import HudHeader from '@/components/sky/HudHeader.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import StatusBadge from '@/components/sky/StatusBadge.vue'

const gameStore = useGameStore()
const playerStore = usePlayerStore()
const hangarStore = useHangarStore()

const skin = computed(() => (hangarStore.skinId === 'taking-off' ? 'taking-off' : hangarStore.skinId))
const craft = computed(() => hangarStore.craftId)

const betAmountInput = ref(250)
const autoCashoutEnabled = ref(false)
const autoCashoutTarget = ref(2)
const isPlacingBet = ref(false)
const isCashingOut = ref(false)

const credits = computed(() => playerStore.profile?.creditBalance ?? 0)
const hasActiveBet = computed(() => gameStore.myBetStatus === 'Placed')
const canPlaceBet = computed(() => gameStore.phase === 'Waiting' && !hasActiveBet.value)
const canCashOut = computed(
  () => gameStore.phase === 'Running' && hasActiveBet.value && gameStore.cashOutStatus !== 'CashedOut',
)
const potentialPayout = computed(() =>
  gameStore.myBetAmount ? Math.round(gameStore.myBetAmount * gameStore.currentMultiplier) : 0,
)

const phaseLabel = computed(() => {
  switch (gameStore.phase) {
    case 'Waiting':
      return `Next round in ${gameStore.countdownSeconds ?? '…'}s`
    case 'Running':
      return 'Round in progress'
    case 'Crashed':
      return 'Crashed!'
    default:
      return 'Connecting…'
  }
})

const climb = computed(() => Math.min((gameStore.currentMultiplier - 1) / 8, 1))
const takeoffCurve = computed(() => Math.pow(climb.value, 1.85))
const flying = computed(() => gameStore.phase === 'Running')
const crashed = computed(() => gameStore.phase === 'Crashed')
const cashedOutThisRound = computed(() => gameStore.cashOutStatus === 'CashedOut')

// Auto cashout is enforced by the backend (RoundEngineService checks every active
// bet's target against the multiplier each tick and cashes it out authoritatively) —
// the frontend only sends the target once at bet-placement time and then just
// reflects whatever CashOutConfirmed event comes back, auto-triggered or not.
const autoCashoutError = computed(() => {
  if (!autoCashoutEnabled.value) return null
  if (!Number.isFinite(autoCashoutTarget.value) || autoCashoutTarget.value < 1.01) {
    return 'Auto cashout target must be at least 1.01x.'
  }
  return null
})

async function handlePlaceBet() {
  isPlacingBet.value = true
  try {
    const target = autoCashoutEnabled.value ? autoCashoutTarget.value : null
    await gameService.placeBet(betAmountInput.value, target)
  } finally {
    isPlacingBet.value = false
  }
}

async function handleCashOut() {
  isCashingOut.value = true
  try {
    await gameService.cashOut()
  } finally {
    isCashingOut.value = false
  }
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-void">
    <div
      class="absolute inset-0"
      :style="{
        animation: crashed
          ? 'camera-impact 900ms cubic-bezier(0.3,0,0.2,1) both'
          : flying
            ? `camera-climb ${Math.max(0.9, 2.4 - climb * 1.4)}s ease-in-out infinite`
            : 'camera-idle 7s ease-in-out infinite',
        willChange: 'transform',
      }"
    >
      <SkyEnvironment :skin="skin" :progress="flying || crashed ? climb : 0" :dim="crashed ? 0.5 : 0.34" />
      <Ambient :skin="skin" :progress="flying || crashed ? climb : 0" />
    </div>
    <CRTOverlay />

    <HudHeader />

    <main class="relative z-10 mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col items-center px-4 pb-56">
      <p class="text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Round #{{ gameStore.roundNumber ?? '—' }} · {{ phaseLabel }}
      </p>

      <div class="relative mt-2 text-center">
        <p class="font-arcade text-[8px] uppercase tracking-[0.5em] text-muted-foreground">Multiplier</p>
        <p
          :class="[
            'font-arcade text-5xl leading-none sm:text-7xl',
            crashed
              ? 'text-danger [text-shadow:0_0_18px_color-mix(in_oklab,var(--neon-red)_90%,transparent)]'
              : cashedOutThisRound
                ? 'text-lime text-glow-lime'
                : 'text-electric text-glow-blue',
          ]"
          :style="{ animation: flying ? 'multiplier-tick 220ms ease-out' : undefined }"
        >
          {{ gameStore.currentMultiplier.toFixed(2) }}x
        </p>
      </div>

      <div class="relative h-[42vh] min-h-[260px] w-full">
        <div
          aria-hidden
          class="absolute bottom-[10%] left-[8%] h-[2px] w-[92%] origin-left -rotate-45 opacity-25"
          style="background: repeating-linear-gradient(90deg, color-mix(in oklab, var(--neon-blue) 60%, transparent) 0 12px, transparent 12px 26px)"
        />
        <div
          class="absolute bottom-[-5%] transition-transform duration-500 ease-out"
          :style="{
            left: 'calc(50% - 50vw)',
            transform: `translate3d(calc((100vw - 180px) * ${climb}), calc((200px - 42vh) * ${takeoffCurve}), 0) scale(${1 + climb * 0.12})`,
            willChange: 'transform',
          }"
        >
          <Plane :craft="craft" :size="200" :crashing="crashed" :trail="flying || crashed" :trail-intensity="0.6 + climb" />
          <Explosion v-if="crashed" :size="300" class="!absolute !left-1/2 !top-1/2" />
        </div>
      </div>

      <div v-if="cashedOutThisRound" class="animate-sky-pop neon-panel clip-hud w-full max-w-md p-6 text-center">
        <p class="font-display text-sm font-black uppercase tracking-[0.3em] text-lime text-glow-lime">
          Cashed Out{{ gameStore.cashOutResult?.auto ? ' (Auto)' : '' }}
        </p>
        <p class="mt-3 font-arcade text-3xl text-lime text-glow-lime">
          +{{ (gameStore.cashOutResult?.payout ?? 0).toLocaleString() }}
        </p>
        <p class="font-arcade text-[8px] uppercase tracking-[0.4em] text-ember">
          at {{ gameStore.cashOutResult?.cashOutMultiplier.toFixed(2) }}x
        </p>
      </div>

      <div v-else-if="crashed" class="animate-sky-pop neon-panel clip-hud w-full max-w-md border-danger/70 p-6 text-center">
        <p
          class="font-display text-xl font-black uppercase tracking-[0.24em] text-danger [text-shadow:0_0_16px_color-mix(in_oklab,var(--neon-red)_85%,transparent)]"
        >
          {{ hasActiveBet ? 'Flight Over' : 'Round Over' }}
        </p>
        <p class="mt-4 font-arcade text-[8px] uppercase tracking-[0.4em] text-muted-foreground">Crashed at</p>
        <p class="font-arcade text-3xl text-ember text-glow-ember">{{ gameStore.currentMultiplier.toFixed(2) }}x</p>
      </div>

      <div v-if="gameStore.roundBets.length > 0" class="mt-6 w-full max-w-md">
        <NeonPanel title="Bets This Round" accent="magenta">
          <div class="flex flex-wrap gap-2">
            <span
              v-for="b in gameStore.roundBets"
              :key="b.playerId"
              class="clip-hud border border-violet/40 bg-void/50 px-2 py-1 font-arcade text-[8px] text-muted-foreground"
            >
              {{ b.username }}: {{ b.amount }}
            </span>
          </div>
        </NeonPanel>
      </div>
    </main>

    <div class="fixed inset-x-0 bottom-24 z-20 px-4 sm:bottom-28">
      <div class="mx-auto w-full max-w-4xl">
        <NeonPanel v-if="canPlaceBet" accent="magenta" class="w-full">
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
                  type="button"
                  :class="[
                    'clip-hud border-2 px-3 py-1.5 font-arcade text-[9px] transition-all duration-150 active:translate-y-[1px]',
                    betAmountInput === v
                      ? 'border-ember text-ember [box-shadow:var(--glow-ember)]'
                      : 'border-violet/50 text-muted-foreground hover:border-electric hover:text-electric',
                  ]"
                  @click="betAmountInput = v"
                >
                  {{ formatBet(v) }}
                </button>
                <button
                  type="button"
                  class="clip-hud border-2 border-magenta/60 px-3 py-1.5 font-arcade text-[9px] text-magenta transition-all hover:[box-shadow:var(--glow-magenta)]"
                  @click="betAmountInput = credits"
                >
                  Max
                </button>
              </div>

              <div class="mt-4 flex flex-wrap items-center gap-4">
                <div>
                  <p class="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">Bet Amount</p>
                  <input
                    v-model.number="betAmountInput"
                    type="number"
                    min="1"
                    :max="credits"
                    class="mt-1 w-28 border-2 border-violet/50 bg-void/70 px-2 py-1 font-arcade text-lg text-ember text-glow-ember focus:border-magenta focus:outline-none"
                  />
                </div>
                <label class="min-w-[200px]">
                  <span class="flex items-center gap-2 font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">
                    <input v-model="autoCashoutEnabled" type="checkbox" class="accent-[var(--neon-blue)]" />
                    Auto Cashout
                  </span>
                  <input
                    v-model.number="autoCashoutTarget"
                    type="number"
                    min="1.01"
                    step="0.05"
                    :disabled="!autoCashoutEnabled"
                    class="mt-1.5 w-28 border-2 border-violet/50 bg-void/70 px-2 py-1 font-arcade text-sm text-electric text-glow-blue focus:border-magenta focus:outline-none disabled:opacity-40"
                  />
                  <span v-if="autoCashoutEnabled" class="ml-1 text-[9px] text-muted-foreground">x target</span>
                </label>
              </div>

              <p v-if="autoCashoutError" class="mt-2 text-sm text-danger">{{ autoCashoutError }}</p>
              <p v-if="gameStore.myBetStatus === 'Rejected'" class="mt-2 text-sm text-danger">
                {{ gameStore.betRejectionReason }}
              </p>
              <p v-if="gameStore.cashOutStatus === 'Rejected'" class="mt-2 text-sm text-danger">
                {{ gameStore.cashOutRejectionReason }}
              </p>
            </div>

            <div class="flex flex-col gap-2">
              <ArcadeButton
                size="xl"
                variant="primary"
                :disabled="betAmountInput > credits || isPlacingBet || !!autoCashoutError"
                @click="handlePlaceBet"
              >
                {{ isPlacingBet ? 'Placing…' : 'Place Bet' }}
              </ArcadeButton>
              <RouterLink to="/hangar">
                <ArcadeButton size="sm" variant="blue" class="w-full">Hangar</ArcadeButton>
              </RouterLink>
            </div>
          </div>
        </NeonPanel>

        <NeonPanel v-else-if="hasActiveBet && gameStore.phase === 'Waiting'" accent="ember" class="w-full text-center">
          <StatusBadge status="LIVE" />
          <p class="mt-2 font-arcade text-sm text-ember text-glow-ember">
            {{ gameStore.myBetAmount }} credits locked in — {{ phaseLabel.toLowerCase() }}
          </p>
          <p v-if="gameStore.myAutoCashoutTarget" class="mt-1 font-arcade text-[8px] uppercase tracking-[0.2em] text-electric">
            Auto cashout armed at {{ gameStore.myAutoCashoutTarget.toFixed(2) }}x
          </p>
        </NeonPanel>

        <div v-else-if="canCashOut" class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:gap-5">
          <div class="neon-panel clip-hud px-4 py-3">
            <p class="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">Bet</p>
            <p class="font-arcade text-base text-ember text-glow-ember">{{ gameStore.myBetAmount }}</p>
          </div>
          <ArcadeButton variant="cash" size="xl" class="w-full flex-col !gap-0 py-5" :disabled="isCashingOut" @click="handleCashOut">
            <span>{{ isCashingOut ? 'Cashing out…' : 'Cash Out' }}</span>
            <span class="font-arcade text-base sm:text-xl">+{{ potentialPayout.toLocaleString() }}</span>
          </ArcadeButton>
        </div>
      </div>
    </div>

    <NavDock />
  </div>
</template>
