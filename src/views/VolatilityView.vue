<script setup lang="ts">
import { onMounted } from 'vue'
import { useVolatilityStore } from '@/stores/volatilityStore'

const volatilityStore = useVolatilityStore()

onMounted(() => {
  volatilityStore.fetchSummary()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 flex justify-center">
    <div class="w-full max-w-2xl space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Volatility</h1>
        <button
          class="text-sm bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-1.5"
          @click="volatilityStore.fetchSummary"
        >
          Refresh
        </button>
      </div>

      <p v-if="!volatilityStore.summary" class="text-slate-400">Loading distribution…</p>

      <template v-else>
        <p class="text-xs text-slate-500">Based on the last {{ volatilityStore.summary.sampleSize }} crashed rounds</p>

        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div class="bg-slate-900 rounded-xl p-4">
            <div class="text-xs text-slate-400">Mean</div>
            <div class="text-2xl font-bold">{{ volatilityStore.summary.meanCrashPoint }}x</div>
          </div>
          <div class="bg-slate-900 rounded-xl p-4">
            <div class="text-xs text-slate-400">Median</div>
            <div class="text-2xl font-bold">{{ volatilityStore.summary.medianCrashPoint }}x</div>
          </div>
          <div class="bg-slate-900 rounded-xl p-4">
            <div class="text-xs text-slate-400">Std. Deviation</div>
            <div class="text-2xl font-bold">{{ volatilityStore.summary.standardDeviation }}</div>
          </div>
          <div class="bg-slate-900 rounded-xl p-4">
            <div class="text-xs text-slate-400">P10 / P90</div>
            <div class="text-2xl font-bold">{{ volatilityStore.summary.p10 }}x / {{ volatilityStore.summary.p90 }}x</div>
          </div>
          <div class="bg-slate-900 rounded-xl p-4">
            <div class="text-xs text-slate-400">P25 / P75</div>
            <div class="text-2xl font-bold">{{ volatilityStore.summary.p25 }}x / {{ volatilityStore.summary.p75 }}x</div>
          </div>
        </div>

        <div class="space-y-2">
          <div
            v-for="bucket in volatilityStore.summary.histogram"
            :key="bucket.label"
            class="flex items-center gap-3"
          >
            <div class="w-24 text-xs text-slate-400">{{ bucket.label }}</div>
            <div class="flex-1 bg-slate-900 rounded h-4 overflow-hidden">
              <div
                class="bg-crimson-500 h-4"
                :style="{ width: bucket.percentage + '%' }"
              ></div>
            </div>
            <div class="w-16 text-xs text-slate-400 text-right">{{ bucket.percentage }}%</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
