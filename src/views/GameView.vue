<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Volume2, VolumeX, RotateCw, CircleHelp, Zap } from '@lucide/vue'
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
import LobbyFlightBoard from '@/components/sky/LobbyFlightBoard.vue'
import AutoCashOutControl from '@/components/sky/AutoCashOutControl.vue'
import SpinTimerChip from '@/components/sky/SpinTimerChip.vue'
import TutorialOverlay from '@/components/sky/TutorialOverlay.vue'
import { useLobbyFlight } from '@/composables/useLobbyFlight'
import { useTutorial } from '@/composables/useTutorial'
import { getCraft } from '@/lib/craft'
import FeedbackPrompt from '@/components/sky/FeedbackPrompt.vue'
import HowToPlay from '@/components/sky/HowToPlay.vue'
import { useFeedbackPrompt } from '@/composables/useFeedbackPrompt'
import DailyChallengeBar from '@/components/sky/DailyChallengeBar.vue'
import SpinWheel from '@/components/sky/SpinWheel.vue'
import { useGameScreenPrompts } from '@/composables/useGameScreenPrompts'
import { useChallengeStore } from '@/stores/challengeStore'

const gameStore = useGameStore()
const playerStore = usePlayerStore()
const hangarStore = useHangarStore()
const audioStore = useAudioStore()

useGameAudio()
const prompts = useGameScreenPrompts()
const challengeStore = useChallengeStore()
const lobbyFlight = useLobbyFlight()
const tutorial = useTutorial()
const feedback = useFeedbackPrompt({ isBlocked: () => prompts.anyOpen.value || tutorial.isOpen.value })

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
  <!-- Fills exactly one screen: header, flight stage (flex), controls, nav dock. Never scrolls. -->
  <div class="relative flex h-dvh flex-col overflow-hidden bg-void">
    <div class="absolute inset-0 overflow-hidden">
      <SkyEnvironment :skin="skin" :progress="flying || crashed ? climb : 0" :dim="crashed ? 0.5 : 0.34" />
      <Ambient :skin="skin" :progress="flying || crashed ? climb : 0" />
    </div>
    <CRTOverlay />

    <HudHeader />

    <!-- stage above, controls below on every device. The stage always keeps at least 40% of the
         screen height; when space is tight the controls scroll inside themselves instead. -->
    <div class="relative z-10 mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col">
      <main class="relative z-10 flex min-h-[40dvh] min-w-0 flex-1 flex-col px-3 sm:px-4">
        <!-- round strip: number/phase, recent crash points, sound toggle -->
        <div class="flex items-center gap-2">
          <p class="shrink-0 text-[0.625rem] uppercase tracking-[0.24em] text-muted-foreground sm:text-xs sm:tracking-[0.3em]">
            #{{ gameStore.roundNumber ?? '—' }}<span class="hidden sm:inline"> · {{ phaseLabel }}</span>
          </p>
          <ul class="flex min-w-0 flex-1 gap-1.5 overflow-hidden [mask-image:linear-gradient(90deg,black_85%,transparent)]" aria-label="Recent crash points">
            <li
              v-for="(p, i) in gameStore.lastCrashPoints"
              :key="`${i}-${p}`"
              :class="['clip-hud shrink-0 border bg-void/60 px-2 py-0.5 font-arcade text-[0.5rem]', crashChipClass(p)]"
            >
              {{ p.toFixed(2) }}x
            </li>
          </ul>
          <LobbyFlightBoard
            mode="chip"
            :me="lobbyFlight.me.value"
            :mates="lobbyFlight.mates.value"
            :in-lobby="lobbyFlight.inLobby.value"
            :lobby-name="lobbyFlight.lobbyName.value"
            :multiplier="gameStore.currentMultiplier"
          />
          <button
            type="button"
            aria-label="How to play: replay the tutorial"
            title="How to play"
            class="grid h-8 w-8 shrink-0 place-items-center border-2 border-violet/50 bg-void/70 text-muted-foreground clip-hud transition-colors hover:border-electric hover:text-electric"
            @click="tutorial.open()"
          >
            <CircleHelp class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            :aria-label="audioStore.effectsEnabled ? 'Mute plane and game sounds' : 'Unmute plane and game sounds'"
            :aria-pressed="!audioStore.effectsEnabled"
            :title="audioStore.effectsEnabled ? 'Mute plane and game sounds' : 'Unmute plane and game sounds'"
            class="grid h-8 w-8 shrink-0 place-items-center border-2 border-violet/50 bg-void/70 text-muted-foreground clip-hud transition-colors hover:border-electric hover:text-electric"
            @click="audioStore.toggleEffects()"
          >
            <Volume2 v-if="audioStore.effectsEnabled" class="h-3.5 w-3.5" aria-hidden="true" />
            <VolumeX v-else class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <HowToPlay compact class="mt-1.5" />

        <FlightStage :craft="craft" :wingmen="lobbyFlight.mates.value" class="mt-1 min-h-[11.25rem] flex-1">
          <template #readout>
            <div v-if="cashedOutThisRound" class="animate-sky-pop mt-3 text-center">
              <p class="font-display text-xs font-black uppercase tracking-[0.3em] text-lime text-glow-lime sm:text-sm">
                Cashed Out{{ gameStore.cashOutResult?.auto ? ' (Auto)' : '' }}
              </p>
              <p class="mt-1 font-arcade text-xl text-lime text-glow-lime sm:text-2xl">
                +{{ (gameStore.cashOutResult?.payout ?? 0).toLocaleString() }}
              </p>
              <p class="font-arcade text-[0.5rem] uppercase tracking-[0.4em] text-ember">
                at {{ gameStore.cashOutResult?.cashOutMultiplier.toFixed(2) }}x
              </p>
            </div>
            <p
              v-else-if="flying && hasActiveBet && gameStore.myAutoCashoutTarget"
              class="mt-2 inline-flex items-center gap-1.5 border border-electric/70 bg-void/70 px-2 py-0.5 font-arcade text-[0.5rem] uppercase tracking-[0.2em] text-electric"
            >
              <Zap class="h-3 w-3" aria-hidden="true" /> Auto Cash Out at {{ gameStore.myAutoCashoutTarget.toFixed(2) }}x
            </p>
            <p
              v-else-if="crashed"
              class="animate-sky-pop mt-2 font-display text-sm font-black uppercase tracking-[0.24em] text-danger [text-shadow:0_0_16px_color-mix(in_oklab,var(--neon-red)_85%,transparent)] sm:text-lg"
            >
              {{ hasActiveBet ? 'Flight Over' : 'Round Over' }}
            </p>
          </template>

          <!-- me + my lobby-mates this round: panel on larger screens, tap-to-open chip on phones -->
          <LobbyFlightBoard
            :me="lobbyFlight.me.value"
            :mates="lobbyFlight.mates.value"
            :in-lobby="lobbyFlight.inLobby.value"
            :lobby-name="lobbyFlight.lobbyName.value"
            :multiplier="gameStore.currentMultiplier"
          />
        </FlightStage>
      </main>

      <!-- controls: one compact panel for every phase; bottom padding clears the nav dock's peek tab -->
      <div class="relative z-20 min-h-0 overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+2.25rem)] pt-2 sm:px-4">
        <NeonPanel accent="magenta" class="mx-auto w-full max-w-[64rem] [&>div]:p-2.5 sm:[&>div]:p-3">
          <div class="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_minmax(13rem,16rem)] md:items-center md:gap-5">
            <div class="min-w-0 space-y-2">
              <!-- bet amount + quick amounts on one line; the chips scroll rather than wrap -->
              <div class="flex items-center gap-2">
                <label class="shrink-0">
                  <span class="sr-only">Bet amount</span>
                  <input
                    v-model.number="betAmountInput"
                    type="number"
                    inputmode="numeric"
                    min="1"
                    :max="credits"
                    class="block w-24 border-2 border-violet/50 bg-void/70 px-2 py-1 font-arcade text-sm text-ember text-glow-ember focus:border-magenta focus:outline-none sm:w-28 sm:text-base"
                  />
                </label>
                <div class="-my-1 flex min-w-0 flex-1 gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    v-for="v in BET_STEPS"
                    :key="v"
                    type="button"
                    :class="[
                      'clip-hud shrink-0 border-2 px-2.5 py-1.5 font-arcade text-[0.5625rem] transition-all duration-150 active:translate-y-[1px]',
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
                    class="clip-hud shrink-0 border-2 border-magenta/60 px-2.5 py-1.5 font-arcade text-[0.5625rem] text-magenta transition-all hover:[box-shadow:var(--glow-magenta)]"
                    @click="betAmountInput = credits"
                  >
                    Max
                  </button>
                </div>
              </div>

              <!-- auto cash out, free-spin status and plane on the second line -->
              <div class="flex flex-wrap items-center gap-2">
                <AutoCashOutControl
                  v-model:enabled="autoCashoutEnabled"
                  v-model:target="autoCashoutTarget"
                  :locked="hasActiveBet"
                  :armed-target="gameStore.myAutoCashoutTarget"
                  :error="autoCashoutError"
                />
                <SpinTimerChip />
                <button
                  v-if="prompts.outOfCredits.value"
                  type="button"
                  class="flex items-center gap-1.5 border-2 border-ember px-2 py-1 font-arcade text-[0.5rem] uppercase tracking-[0.15em] text-foreground [box-shadow:var(--glow-ember)] hover:bg-ember/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember"
                  @click="prompts.openWheel"
                >
                  <RotateCw class="h-3 w-3" aria-hidden="true" /> Out of credits?
                </button>
                <RouterLink
                  to="/hangar"
                  :aria-label="`Your plane: ${getCraft(craft).name}. Open the hangar to change plane and sky`"
                  class="clip-hud ml-auto hidden items-center gap-1.5 border-2 border-electric bg-void/70 py-0.5 pl-1 pr-2.5 text-electric transition-all hover:[box-shadow:var(--glow-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric sm:flex"
                >
                  <img
                    :src="getCraft(craft).src"
                    alt=""
                    width="1024"
                    height="1024"
                    class="h-5 w-5 object-contain"
                    :style="{ transform: `rotate(${getCraft(craft).rotate}deg)` }"
                  />
                  <span class="text-sm font-bold text-foreground">{{ getCraft(craft).name }} <span class="text-electric">· Change</span></span>
                </RouterLink>
              </div>

              <p v-if="gameStore.myBetStatus === 'Rejected'" class="text-sm text-danger">
                {{ gameStore.betRejectionReason }}
              </p>
              <p v-if="gameStore.cashOutStatus === 'Rejected'" class="text-sm text-danger">
                {{ gameStore.cashOutRejectionReason }}
              </p>
            </div>

            <!-- the one button that matters, adapting to the round phase -->
            <div class="flex flex-col gap-1.5">
              <ArcadeButton
                v-if="primaryAction === 'cashout'"
                variant="cash"
                size="xl"
                class="w-full flex-col !gap-0 py-2 sm:py-3"
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
                <p v-if="gameStore.myAutoCashoutTarget" class="mt-1 font-arcade text-[0.4375rem] uppercase tracking-[0.2em] text-electric">
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
                <span class="font-arcade text-[0.5rem] tracking-[0.2em]">
                  {{ queuedForNextRound ? 'Queued for next round' : 'Next round' }}
                </span>
              </ArcadeButton>

              <p v-if="finePointer && primaryAction !== 'locked'" class="hidden text-center font-arcade text-[0.4375rem] uppercase tracking-[0.3em] text-muted-foreground md:block">
                Press <kbd class="border border-violet/50 px-1">Space</kbd>
              </p>
            </div>
          </div>
        </NeonPanel>
      </div>
    </div>

    <NavDock />

    <DailyChallengeBar
      v-if="prompts.briefingOpen.value"
      :challenges="challengeStore.challenges"
      @close="prompts.closeBriefing"
    />
    <SpinWheel v-if="prompts.wheelOpen.value" :out-of-credits="prompts.outOfCredits.value" @close="prompts.closeWheel" />

    <FeedbackPrompt
      v-if="feedback.isOpen.value && !prompts.anyOpen.value && !tutorial.isOpen.value"
      :controller="feedback"
    />

    <TutorialOverlay v-if="tutorial.isOpen.value" @close="tutorial.finish" />
  </div>
</template>
