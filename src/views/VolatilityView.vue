<script setup lang="ts">
import { onMounted } from 'vue'
import { useVolatilityStore } from '@/stores/volatilityStore'
import Shell from '@/components/sky/Shell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ScoreDisplay from '@/components/sky/ScoreDisplay.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import AdminTabs from '@/components/sky/AdminTabs.vue'

const volatilityStore = useVolatilityStore()

onMounted(() => {
  volatilityStore.fetchSummary()
})
</script>

<template>
  <Shell skin="midnight" :dim="0.65">
    <div class="mx-auto w-full max-w-2xl">
      <div class="flex items-center justify-between">
        <h1 class="font-display text-2xl font-black uppercase tracking-[0.2em] text-ember text-glow-ember sm:text-3xl">
          Volatility
        </h1>
        <ArcadeButton size="sm" variant="ghost" @click="volatilityStore.fetchSummary">Refresh</ArcadeButton>
      </div>
      <div class="mt-4"><AdminTabs /></div>

      <p v-if="!volatilityStore.summary" class="mt-6 text-muted-foreground">Loading distribution…</p>

      <template v-else>
        <p class="mt-5 text-xs text-muted-foreground">
          Based on the last {{ volatilityStore.summary.sampleSize }} crashed rounds
        </p>

        <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <NeonPanel accent="blue"><ScoreDisplay label="Mean" tone="blue">{{ volatilityStore.summary.meanCrashPoint }}x</ScoreDisplay></NeonPanel>
          <NeonPanel accent="lime"><ScoreDisplay label="Median" tone="lime">{{ volatilityStore.summary.medianCrashPoint }}x</ScoreDisplay></NeonPanel>
          <NeonPanel accent="magenta"><ScoreDisplay label="Std. Deviation" tone="magenta">{{ volatilityStore.summary.standardDeviation }}</ScoreDisplay></NeonPanel>
          <NeonPanel accent="ember"><ScoreDisplay label="P10 / P90" tone="ember">{{ volatilityStore.summary.p10 }}x / {{ volatilityStore.summary.p90 }}x</ScoreDisplay></NeonPanel>
          <NeonPanel accent="ember"><ScoreDisplay label="P25 / P75" tone="ember">{{ volatilityStore.summary.p25 }}x / {{ volatilityStore.summary.p75 }}x</ScoreDisplay></NeonPanel>
        </div>

        <NeonPanel class="mt-4" title="Crash Point Distribution" accent="blue">
          <div class="space-y-2">
            <div v-for="bucket in volatilityStore.summary.histogram" :key="bucket.label" class="flex items-center gap-3">
              <div class="w-20 shrink-0 font-arcade text-[8px] uppercase text-muted-foreground">{{ bucket.label }}</div>
              <div class="h-3 flex-1 overflow-hidden rounded-sm border border-violet/40 bg-void/60">
                <div
                  class="h-full bg-[image:var(--grad-sunset)] [box-shadow:var(--glow-ember)]"
                  :style="{ width: bucket.percentage + '%' }"
                />
              </div>
              <div class="w-14 shrink-0 text-right text-xs text-muted-foreground">{{ bucket.percentage }}%</div>
            </div>
          </div>
        </NeonPanel>
      </template>
    </div>
  </Shell>
</template>
