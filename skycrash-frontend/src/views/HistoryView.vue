<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useHistoryStore } from '@/stores/historyStore'

const historyStore = useHistoryStore()
const activeTab = ref<'rounds' | 'bets'>('rounds')

onMounted(() => {
  historyStore.fetchRounds(1)
  historyStore.fetchBets(1)
})

function statusColor(status: string) {
  if (status === 'CashedOut') return 'text-emerald-400'
  if (status === 'Lost') return 'text-red-400'
  return 'text-slate-400'
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 px-4 py-6 sm:py-10 flex justify-center">
    <div class="w-full max-w-lg space-y-4">
      <h1 class="text-2xl font-bold">History</h1>

      <div class="flex gap-2">
        <button
          @click="activeTab = 'rounds'"
          class="px-3 py-1 rounded-md text-sm"
          :class="activeTab === 'rounds' ? 'bg-indigo-600' : 'bg-slate-800 text-slate-400'"
        >
          Recent Rounds
        </button>
        <button
          @click="activeTab = 'bets'"
          class="px-3 py-1 rounded-md text-sm"
          :class="activeTab === 'bets' ? 'bg-indigo-600' : 'bg-slate-800 text-slate-400'"
        >
          My Bets
        </button>
      </div>

      <div v-if="activeTab === 'rounds'" class="bg-slate-900 rounded-xl divide-y divide-slate-800">
        <div v-if="historyStore.rounds.length === 0" class="p-4 text-slate-400 text-sm">
          No rounds yet.
        </div>
        <div v-for="r in historyStore.rounds" :key="r.roundId" class="p-3 flex items-center justify-between text-sm">
          <span class="text-slate-400">Round #{{ r.roundNumber }}</span>
          <span :class="r.crashMultiplier >= 2 ? 'text-emerald-400' : 'text-slate-300'">
            {{ r.crashMultiplier.toFixed(2) }}x
          </span>
        </div>
      </div>

      <div v-else class="bg-slate-900 rounded-xl divide-y divide-slate-800">
        <div v-if="historyStore.bets.length === 0" class="p-4 text-slate-400 text-sm">
          No bets placed yet.
        </div>
        <div v-for="b in historyStore.bets" :key="b.betId" class="p-3 flex items-center justify-between text-sm">
          <div>
            <div class="text-slate-400">Round #{{ b.roundNumber }} — bet {{ b.amount }}</div>
            <div :class="statusColor(b.status)">
              {{ b.status }}
              <template v-if="b.status === 'CashedOut'">
                at {{ b.cashOutMultiplier?.toFixed(2) }}x for {{ b.payout }}
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
