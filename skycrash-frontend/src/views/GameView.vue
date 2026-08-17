<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'
import * as gameService from '@/services/gameService'

const gameStore = useGameStore()
const playerStore = usePlayerStore()
const betAmountInput = ref(100)
const isPlacingBet = ref(false)

const displayMultiplier = computed(() => `${gameStore.currentMultiplier.toFixed(2)}x`)

const phaseLabel = computed(() => {
    switch (gameStore.phase) {
        case 'Waiting':
            return `Next round starts in ${gameStore.countdownSeconds ?? '…'}s`
        case 'Running':
            return 'Round in progress'
        case 'Crashed':
            return 'Crashed!'
        default:
            return 'Connecting…'
    }
})
const canPlaceBet = computed(
    () => gameStore.phase === 'Waiting' && gameStore.myBetStatus !== 'Placed'
)

async function handlePlaceBet() {
    isPlacingBet.value = true
    try {
        await gameService.placeBet(betAmountInput.value)
    } finally {
        isPlacingBet.value = false
    }
}

</script>

<template>
    <div class="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 flex flex-col items-center">
        <div class="w-full max-w-lg space-y-6 text-center">
            <p class="text-slate-400 text-sm">Round #{{ gameStore.roundNumber ?? '—' }}</p>

            <div class="rounded-2xl py-16 text-6xl font-bold transition-colors" :class="{
                'bg-slate-900 text-slate-100': gameStore.phase !== 'Crashed',
                'bg-red-950 text-red-400': gameStore.phase === 'Crashed'
            }">
                {{ displayMultiplier }}
            </div>

            <p class="text-slate-300">{{ phaseLabel }}</p>


            <!--div v-if="gameStore.serverSeedHash" class="text-xs text-slate-500 break-all">
        Seed hash (committed before round): {{ gameStore.serverSeedHash }}
      </div>
      <div v-if="gameStore.lastRevealedSeed && gameStore.phase === 'Crashed'" class="text-xs text-slate-500 break-all">
        Revealed seed: {{ gameStore.lastRevealedSeed }}
      </div>

      <div v-if="gameStore.lastCrashPoints.length > 0" class="pt-4">
        <p class="text-sm text-slate-400 mb-2">Recent crashes</p>
        <div class="flex flex-wrap gap-2 justify-center">
          <span
            v-for="(point, index) in gameStore.lastCrashPoints"
            :key="index"
            class="px-3 py-1 rounded-full text-sm"
            :class="point >= 2 ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-300'"
          >
            {{ point.toFixed(2) }}x
          </span-->
            <div class="bg-slate-900 rounded-xl p-4 space-y-3 text-left">
                <div v-if="gameStore.myBetStatus === 'Placed'" class="text-emerald-400 text-sm">
                    Bet placed: {{ gameStore.myBetAmount }} credits
                </div>

                <div v-else class="space-y-2">
                    <div class="flex gap-2">
                        <input v-model.number="betAmountInput" type="number" min="1"
                            :max="playerStore.profile?.creditBalance ?? undefined"
                            class="flex-1 rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button @click="handlePlaceBet" :disabled="!canPlaceBet || isPlacingBet"
                            class="rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 font-medium transition">
                            {{ isPlacingBet ? 'Placing…' : 'Place Bet' }}
                        </button>
                    </div>
                    <p v-if="gameStore.myBetStatus === 'Rejected'" class="text-sm text-red-400">
                        {{ gameStore.betRejectionReason }}
                    </p>
                    <p v-if="gameStore.phase !== 'Waiting'" class="text-sm text-slate-500">
                        Betting opens when the next round starts waiting.
                    </p>
                </div>

                <div v-if="gameStore.roundBets.length > 0" class="pt-2 border-t border-slate-800">
                    <p class="text-xs text-slate-500 mb-1">Bets this round</p>
                    <div class="flex flex-wrap gap-2">
                        <span v-for="b in gameStore.roundBets" :key="b.playerId"
                            class="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                            {{ b.username }}: {{ b.amount }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
       </div> 
</template>
