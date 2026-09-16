<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useOperationsStore } from '@/stores/operationsStore'
import Shell from '@/components/sky/Shell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ScoreDisplay from '@/components/sky/ScoreDisplay.vue'
import AdminTabs from '@/components/sky/AdminTabs.vue'

const operationsStore = useOperationsStore()

onMounted(() => {
  operationsStore.startPolling()
})

onUnmounted(() => {
  operationsStore.stopPolling()
})
</script>

<template>
  <Shell skin="midnight" :dim="0.65">
    <div class="mx-auto w-full max-w-4xl">
      <h1 class="font-display text-2xl font-black uppercase tracking-[0.2em] text-ember text-glow-ember sm:text-3xl">
        Operations
      </h1>
      <div class="mt-4"><AdminTabs /></div>

      <div v-if="operationsStore.metrics" class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <NeonPanel accent="blue"><ScoreDisplay label="Online Players" tone="blue">{{ operationsStore.metrics.onlinePlayers }}</ScoreDisplay></NeonPanel>
        <NeonPanel accent="magenta"><ScoreDisplay label="Round Status" tone="magenta">{{ operationsStore.metrics.currentRoundStatus }}</ScoreDisplay></NeonPanel>
        <NeonPanel accent="ember"><ScoreDisplay label="Current Round" tone="ember">#{{ operationsStore.metrics.currentRoundNumber ?? '—' }}</ScoreDisplay></NeonPanel>
        <NeonPanel accent="lime"><ScoreDisplay label="Rounds (Last Hour)" tone="lime">{{ operationsStore.metrics.roundsLastHour }}</ScoreDisplay></NeonPanel>
        <NeonPanel accent="ember"><ScoreDisplay label="Wagered (Last Hour)" tone="ember">{{ operationsStore.metrics.totalWageredLastHour }}</ScoreDisplay></NeonPanel>
        <NeonPanel accent="blue"><ScoreDisplay label="Active Bets (Round)" tone="blue">{{ operationsStore.metrics.activeBetsThisRound }}</ScoreDisplay></NeonPanel>
      </div>

      <p v-else class="mt-6 text-muted-foreground">Loading metrics…</p>
    </div>
  </Shell>
</template>
