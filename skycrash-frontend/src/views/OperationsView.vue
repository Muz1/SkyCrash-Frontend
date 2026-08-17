<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useOperationsStore } from '@/stores/operationsStore'

const operationsStore = useOperationsStore()

onMounted(() => {
  operationsStore.startPolling()
})

onUnmounted(() => {
  operationsStore.stopPolling()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 flex justify-center">
    <div class="w-full max-w-2xl space-y-4">
      <h1 class="text-2xl font-bold">Operations</h1>

      <div v-if="operationsStore.metrics" class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="bg-slate-900 rounded-xl p-4">
          <div class="text-xs text-slate-400">Online Players</div>
          <div class="text-2xl font-bold">{{ operationsStore.metrics.onlinePlayers }}</div>
        </div>
        <div class="bg-slate-900 rounded-xl p-4">
          <div class="text-xs text-slate-400">Round Status</div>
          <div class="text-2xl font-bold">{{ operationsStore.metrics.currentRoundStatus }}</div>
        </div>
        <div class="bg-slate-900 rounded-xl p-4">
          <div class="text-xs text-slate-400">Current Round</div>
          <div class="text-2xl font-bold">#{{ operationsStore.metrics.currentRoundNumber ?? '—' }}</div>
        </div>
        <div class="bg-slate-900 rounded-xl p-4">
          <div class="text-xs text-slate-400">Rounds (Last Hour)</div>
          <div class="text-2xl font-bold">{{ operationsStore.metrics.roundsLastHour }}</div>
        </div>
        <div class="bg-slate-900 rounded-xl p-4">
          <div class="text-xs text-slate-400">Wagered (Last Hour)</div>
          <div class="text-2xl font-bold">{{ operationsStore.metrics.totalWageredLastHour }}</div>
        </div>
        <div class="bg-slate-900 rounded-xl p-4">
          <div class="text-xs text-slate-400">Active Bets (Round)</div>
          <div class="text-2xl font-bold">{{ operationsStore.metrics.activeBetsThisRound }}</div>
        </div>
      </div>

      <p v-else class="text-slate-400">Loading metrics…</p>
    </div>
  </div>
</template>
