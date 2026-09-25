<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Volume2, VolumeX, Users, Warehouse } from '@lucide/vue'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useHangarStore } from '@/stores/hangarStore'
import { useAudioStore } from '@/stores/audioStore'
import { useGameAudio } from '@/composables/useGameAudio'
import * as gameService from '@/services/gameService'
import { BET_STEPS, formatBet } from '@/lib/betSteps'
import SkyEnvironment from '@/components/sky/SkyEnvironment.vue'
import Ambient from '@/components/sky/Ambient.vue'
import CRTOverlay from '@/components/sky/CRTOverlay.vue'
import FlightStage from '@/components/sky/FlightStage.vue'
import NavDock from '@/components/sky/NavDock.vue'
import HudHeader from '@/components/sky/HudHeader.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import StatusBadge from '@/components/sky/StatusBadge.vue'
import AchievementBadge from '@/components/sky/AchievementBadge.vue'

const gameStore = useGameStore()
const playerStore = usePlayerStore()
const hangarStore = useHangarStore()
const audioStore = useAudioStore()

useGameAudio()

const skin = computed(() => (hangarStore.skinId === 'taking-off' ? 'taking-off' : hangarStore.skinId))
const craft = computed(() => hangarStore.craftId)

// ---------- remembered bet settings (so a returning pilot doesn't re-enter them) ----------

const PREFS_KEY = 'skycrash_bet_prefs'
type BetPrefs = { amount: number; autoEnabled: boolean; autoTarget: number }
function loadBetPrefs(): BetPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<BetPrefs>
      return {
        amount: typeof p.amount === 'number' && p.amount > 0 ? p.amount : 250,
        autoEnabled: p.autoEnabled ?? false,
        autoTarget: typeof p.autoTarget === 'number' ? p.autoTarget : 2,
      }
    }
  } catch {
    // Storage unavailable: use defaults.
  }
  return { amount: 250, autoEnabled: false, autoTarget: 2 }
}
const prefs = loadBetPrefs()

const betAmountInput = ref(prefs.amount)
const autoCashoutEnabled = ref(prefs.autoEnabled)
const autoCashoutTarget = ref(prefs.autoTarget)
const isPlacingBet = ref(false)
const isCashingOut = ref(false)
/** Bet requested while a round was in flight; placed automatically when the next round opens. */
const queuedForNextRound = ref(false)
const showRoundBets = ref(false)

watch([betAmountInput, autoCashoutEnabled, autoCashoutTarget], () => {
  try {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ amount: betAmountInput.value, autoEnabled: autoCashoutEnabled.value, autoTarget: autoCashoutTarget.value }),
    )
  } catch {
    // Non-fatal.
  }
})

const credits = computed(() => playerStore.profile?.creditBalance ?? 0)
const hasActiveBet = computed(() => gameStore.myBetStatus === 'Placed')
const canPlaceBet = computed(() => gameStore.phase === 'Waiting' && !hasActiveBet.value)
const canCashOut = computed(
  () => gameStore.phase === 'Running' && hasActiveBet.value && gameStore.cashOutStatus !== 'CashedOut',
)
const lockedIn = computed(() => hasActiveBet.value && gameStore.phase === 'Waiting')
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

const betInvalid = computed(
  () => !(betAmountInput.value > 0) || betAmountInput.value > credits.value || !!autoCashoutError.value,
)

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

// Place the queued bet as soon as betting opens for the next round.
watch(
  () => gameStore.phase,
  (phase) => {
    if (phase === 'Waiting' && queuedForNextRound.value) {
      queuedForNextRound.value = false
      if (!betInvalid.value) void handlePlaceBet()
    }
  },
)

type PrimaryAction = 'cashout' | 'bet' | 'locked' | 'queue'
const primaryAction = computed<PrimaryAction>(() => {
  if (canCashOut.value) return 'cashout'
  if (canPlaceBet.value) return 'bet'
  if (lockedIn.value) return 'locked'
  return 'queue'
})

function runPrimaryAction() {
  switch (primaryAction.value) {
    case 'cashout':
      if (!isCashingOut.value) void handleCashOut()
      break
    case 'bet':
      if (!isPlacingBet.value && !betInvalid.value) void handlePlaceBet()
      break
    case 'queue':
      if (queuedForNextRound.value || !betInvalid.value) queuedForNextRound.value = !queuedForNextRound.value
      break
  }
}

// Space bar = the main button (bet / cash out / queue), like most crash games.
function onKeyDown(e: KeyboardEvent) {
  if (e.code !== 'Space' || e.repeat) return
  const el = e.target as HTMLElement | null
  if (el?.closest('input, textarea, select, button, a, [contenteditable="true"]')) return
  e.preventDefault()
  runPrimaryAction()
}

const finePointer = ref(false)
onMounted(() => {
  finePointer.value = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false
  window.addEventListener('keydown', onKeyDown)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))

function crashChipClass(value: number) {
  if (value >= 10) return 'border-magenta/70 text-magenta'
  if (value >= 2) return 'border-electric/60 text-electric'
  return 'border-violet/50 text-muted-foreground'
}
</script>

<template>
  <!-- Fills exactly one screen: header, flight stage (flex), controls. Falls back to scrolling only on very short viewports. -->
  <div class="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-void">
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

    <main class="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 sm:px-4">
      <!-- round strip: number/phase, recent crash points, sound toggle -->
      <div class="flex items-center gap-2">
        <p class="shrink-0 text-[10px] uppercase tracking-[0.24em] text-muted-foreground sm:text-xs sm:tracking-[0.3em]">
          #{{ gameStore.roundNumber ?? '—' }}<span class="hidden sm:inline"> · {{ phaseLabel }}</span>
        </p>
        <ul class="flex min-w-0 flex-1 gap-1.5 overflow-hidden [mask-image:linear-gradient(90deg,black_85%,transparent)]" aria-label="Recent crash points">
          <li
            v-for="(p, i) in gameStore.lastCrashPoints"
            :key="`${i}-${p}`"
            :class="['clip-hud shrink-0 border bg-void/60 px-2 py-0.5 font-arcade text-[8px]', crashChipClass(p)]"
          >
            {{ p.toFixed(2) }}x
          </li>
        </ul>
        <button
          type="button"
          :aria-label="audioStore.sfxEnabled ? 'Mute game sounds' : 'Unmute game sounds'"
          :aria-pressed="audioStore.sfxEnabled"
          :title="audioStore.sfxEnabled ? 'Mute game sounds' : 'Unmute game sounds'"
          class="grid h-8 w-8 shrink-0 place-items-center border-2 border-violet/50 bg-void/70 text-muted-foreground clip-hud transition-colors hover:border-electric hover:text-electric"
          @click="audioStore.toggleSfx()"
        >
          <Volume2 v-if="audioStore.sfxEnabled" class="h-3.5 w-3.5" aria-hidden="true" />
          <VolumeX v-else class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <FlightStage :craft="craft" class="mt-1 min-h-[180px] flex-1">
        <template #readout>
          <div v-if="cashedOutThisRound" class="animate-sky-pop mt-3 text-center">
            <p class="font-display text-xs font-black uppercase tracking-[0.3em] text-lime text-glow-lime sm:text-sm">
              Cashed Out{{ gameStore.cashOutResult?.auto ? ' (Auto)' : '' }}
            </p>
            <p class="mt-1 font-arcade text-xl text-lime text-glow-lime sm:text-2xl">
              +{{ (gameStore.cashOutResult?.payout ?? 0).toLocaleString() }}
            </p>
            <p class="font-arcade text-[8px] uppercase tracking-[0.4em] text-ember">
              at {{ gameStore.cashOutResult?.cashOutMultiplier.toFixed(2) }}x
            </p>
          </div>
          <p
            v-else-if="crashed"
            class="animate-sky-pop mt-2 font-display text-sm font-black uppercase tracking-[0.24em] text-danger [text-shadow:0_0_16px_color-mix(in_oklab,var(--neon-red)_85%,transparent)] sm:text-lg"
          >
            {{ hasActiveBet ? 'Flight Over' : 'Round Over' }}
          </p>
        </template>

        <!-- bets this round: panel on larger screens, tap-to-open chip on phones -->
        <div v-if="gameStore.roundBets.length > 0" class="absolute right-0 top-1 z-10 flex max-h-[55%] flex-col items-end">
          <button
            type="button"
            class="clip-hud flex items-center gap-1.5 border border-magenta/60 bg-void/75 px-2 py-1 font-arcade text-[8px] uppercase text-magenta sm:hidden"
            :aria-expanded="showRoundBets"
            @click="showRoundBets = !showRoundBets"
          >
            <Users class="h-3 w-3" aria-hidden="true" /> {{ gameStore.roundBets.length }}
          </button>
          <div
            :class="[
              'neon-panel clip-hud mt-1 w-56 min-h-0 overflow-y-auto p-2',
              showRoundBets ? 'block' : 'hidden sm:block',
            ]"
          >
            <p class="mb-1.5 font-display text-[9px] font-black uppercase tracking-[0.3em] text-magenta">Bets This Round</p>
            <ul class="flex flex-col gap-1">
              <li
                v-for="(b, i) in gameStore.roundBets"
                :key="`${b.playerId}-${i}`"
                :class="[
                  'flex items-center gap-1 font-arcade text-[8px]',
                  b.kind === 'cashout' ? 'text-lime' : 'text-muted-foreground',
                ]"
              >
                <AchievementBadge :achievement-key="b.displayedAchievementKey" size="xs" />
                <span class="truncate">{{ b.username }}</span>
                <span class="ml-auto shrink-0">
                  {{ b.kind === 'cashout' ? `+${b.amount} @ ${b.cashOutMultiplier?.toFixed(2)}x` : b.amount }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </FlightStage>
    </main>

    <!-- controls: one compact panel for every phase; bottom padding clears the nav dock's peek tab -->
    <div class="relative z-20 px-3 pb-[calc(env(safe-area-inset-bottom)+2.25rem)] pt-2 sm:px-4">
      <NeonPanel accent="magenta" class="mx-auto w-full max-w-4xl [&>div]:p-3 sm:[&>div]:p-4">
        <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(240px,300px)] md:items-center">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <p class="hidden font-display text-sm font-black uppercase tracking-[0.2em] text-magenta text-glow-magenta sm:block">
                New Flight
              </p>
              <RouterLink
                to="/hangar"
                class="ml-auto hidden items-center gap-1 font-arcade text-[7px] uppercase tracking-[0.2em] text-electric hover:text-foreground sm:flex"
              >
                <Warehouse class="h-3 w-3" aria-hidden="true" /> Hangar
              </RouterLink>
            </div>

            <!-- quick amounts: single scrollable row so it never wraps onto extra lines -->
            <div class="-mx-1 mt-0 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] sm:mt-2 [&::-webkit-scrollbar]:hidden">
              <button
                v-for="v in BET_STEPS"
                :key="v"
                type="button"
                :class="[
                  'clip-hud shrink-0 border-2 px-3 py-1.5 font-arcade text-[9px] transition-all duration-150 active:translate-y-[1px]',
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
                class="clip-hud shrink-0 border-2 border-magenta/60 px-3 py-1.5 font-arcade text-[9px] text-magenta transition-all hover:[box-shadow:var(--glow-magenta)]"
                @click="betAmountInput = credits"
              >
                Max
              </button>
            </div>

            <div class="mt-2.5 flex flex-wrap items-end gap-x-4 gap-y-2">
              <label class="block">
                <span class="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">Bet Amount</span>
                <input
                  v-model.number="betAmountInput"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  :max="credits"
                  class="mt-1 block w-28 border-2 border-violet/50 bg-void/70 px-2 py-1 font-arcade text-base text-ember text-glow-ember focus:border-magenta focus:outline-none"
                />
              </label>
              <div>
                <label class="flex cursor-pointer items-center gap-2 font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">
                  <input v-model="autoCashoutEnabled" type="checkbox" class="accent-[var(--neon-blue)]" />
                  Auto Cashout
                </label>
                <div class="mt-1 flex items-center gap-1">
                  <input
                    v-model.number="autoCashoutTarget"
                    type="number"
                    inputmode="decimal"
                    min="1.01"
                    step="0.05"
                    :disabled="!autoCashoutEnabled"
                    aria-label="Auto cashout target multiplier"
                    class="block w-24 border-2 border-violet/50 bg-void/70 px-2 py-1 font-arcade text-sm text-electric text-glow-blue focus:border-magenta focus:outline-none disabled:opacity-40"
                  />
                  <span class="text-[9px] text-muted-foreground">x</span>
                </div>
              </div>
            </div>

            <p v-if="autoCashoutError" class="mt-1.5 text-sm text-danger">{{ autoCashoutError }}</p>
            <p v-if="gameStore.myBetStatus === 'Rejected'" class="mt-1.5 text-sm text-danger">
              {{ gameStore.betRejectionReason }}
            </p>
            <p v-if="gameStore.cashOutStatus === 'Rejected'" class="mt-1.5 text-sm text-danger">
              {{ gameStore.cashOutRejectionReason }}
            </p>
          </div>

          <!-- the one button that matters, adapting to the round phase -->
          <div class="flex flex-col gap-1.5">
            <ArcadeButton
              v-if="primaryAction === 'cashout'"
              variant="cash"
              size="xl"
              class="w-full flex-col !gap-0 py-4"
              :disabled="isCashingOut"
              @click="runPrimaryAction"
            >
              <span>{{ isCashingOut ? 'Cashing out…' : 'Cash Out' }}</span>
              <span class="font-arcade text-base sm:text-xl">+{{ potentialPayout.toLocaleString() }}</span>
            </ArcadeButton>

            <ArcadeButton
              v-else-if="primaryAction === 'bet'"
              size="xl"
              variant="primary"
              class="w-full"
              :disabled="betInvalid || isPlacingBet"
              @click="runPrimaryAction"
            >
              {{ isPlacingBet ? 'Placing…' : `Bet ${betAmountInput > 0 ? betAmountInput.toLocaleString() : ''}` }}
            </ArcadeButton>

            <div v-else-if="primaryAction === 'locked'" class="neon-panel clip-hud px-3 py-3 text-center">
              <StatusBadge status="LIVE" />
              <p class="mt-1.5 font-arcade text-xs text-ember text-glow-ember">{{ gameStore.myBetAmount }} locked in</p>
              <p v-if="gameStore.myAutoCashoutTarget" class="mt-1 font-arcade text-[7px] uppercase tracking-[0.2em] text-electric">
                Auto cashout at {{ gameStore.myAutoCashoutTarget.toFixed(2) }}x
              </p>
            </div>

            <ArcadeButton
              v-else
              :variant="queuedForNextRound ? 'ghost' : 'magenta'"
              size="lg"
              class="w-full flex-col !gap-0.5"
              :disabled="!queuedForNextRound && betInvalid"
              @click="runPrimaryAction"
            >
              <span>{{ queuedForNextRound ? 'Cancel' : `Bet ${betAmountInput > 0 ? betAmountInput.toLocaleString() : ''}` }}</span>
              <span class="font-arcade text-[8px] tracking-[0.2em]">
                {{ queuedForNextRound ? 'Queued for next round' : 'Next round' }}
              </span>
            </ArcadeButton>

            <p v-if="finePointer && primaryAction !== 'locked'" class="hidden text-center font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground md:block">
              Press <kbd class="border border-violet/50 px-1">Space</kbd>
            </p>
          </div>
        </div>
      </NeonPanel>
    </div>

    <NavDock />
  </div>
</template>
