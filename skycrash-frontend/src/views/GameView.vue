<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

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
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 flex flex-col items-center">
    <div class="w-full max-w-lg space-y-6 text-center">
      <p class="text-slate-400 text-sm">Round #{{ gameStore.roundNumber ?? '—' }}</p>

      <div
        class="rounded-2xl py-16 text-6xl font-bold transition-colors"
        :class="{
          'bg-slate-900 text-slate-100': gameStore.phase !== 'Crashed',
          'bg-red-950 text-red-400': gameStore.phase === 'Crashed'
        }"
      >
        {{ displayMultiplier }}
      </div>

      <p class="text-slate-300">{{ phaseLabel }}</p>

      <div v-if="gameStore.serverSeedHash" class="text-xs text-slate-500 break-all">
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
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
