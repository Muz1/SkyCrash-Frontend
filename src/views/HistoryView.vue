<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useHistoryStore } from '@/stores/historyStore'
import Shell from '@/components/sky/Shell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import StatusBadge from '@/components/sky/StatusBadge.vue'

const historyStore = useHistoryStore()
const activeTab = ref<'rounds' | 'bets'>('bets')

onMounted(() => {
  historyStore.fetchRounds(1)
  historyStore.fetchBets(1)
})

function betStatus(status: string): 'CASHED OUT' | 'CRASHED' | 'LIVE' {
  if (status === 'CashedOut') return 'CASHED OUT'
  if (status === 'Lost') return 'CRASHED'
  return 'LIVE'
}
</script>

<template>
  <Shell skin="cape-town" :dim="0.6">
    <div class="mx-auto w-full max-w-2xl">
      <h1 class="text-center font-display text-2xl font-black uppercase tracking-[0.2em] text-electric text-glow-blue sm:text-3xl">
        Flight Log
      </h1>

      <div class="mt-6 flex justify-center gap-3">
        <ArcadeButton size="sm" :variant="activeTab === 'bets' ? 'blue' : 'ghost'" @click="activeTab = 'bets'">
          My Flights
        </ArcadeButton>
        <ArcadeButton size="sm" :variant="activeTab === 'rounds' ? 'blue' : 'ghost'" @click="activeTab = 'rounds'">
          Recent Rounds
        </ArcadeButton>
      </div>

      <NeonPanel class="mt-5" accent="blue">
        <div v-if="activeTab === 'bets'">
          <p v-if="historyStore.bets.length === 0" class="text-sm text-muted-foreground">No flights logged yet.</p>
          <ul v-else class="divide-y divide-border/60">
            <li v-for="b in historyStore.bets" :key="b.betId" class="flex items-center justify-between gap-3 py-3">
              <div class="min-w-0">
                <p class="font-display text-xs uppercase tracking-[0.16em] text-foreground">Round #{{ b.roundNumber }}</p>
                <p class="font-arcade text-[8px] uppercase tracking-[0.2em] text-muted-foreground">Bet {{ b.amount }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span v-if="b.status === 'CashedOut'" class="font-arcade text-xs text-lime text-glow-lime">
                  +{{ b.payout }} @ {{ b.cashOutMultiplier?.toFixed(2) }}x
                </span>
                <StatusBadge :status="betStatus(b.status)" />
              </div>
            </li>
          </ul>
        </div>
        <div v-else>
          <p v-if="historyStore.rounds.length === 0" class="text-sm text-muted-foreground">No rounds yet.</p>
          <ul v-else class="divide-y divide-border/60">
            <li v-for="r in historyStore.rounds" :key="r.roundId" class="flex items-center justify-between py-3">
              <span class="font-display text-xs uppercase tracking-[0.16em] text-muted-foreground">Round #{{ r.roundNumber }}</span>
              <span :class="r.crashMultiplier >= 2 ? 'text-lime text-glow-lime' : 'text-foreground'" class="font-arcade text-sm">
                {{ r.crashMultiplier.toFixed(2) }}x
              </span>
            </li>
          </ul>
        </div>
      </NeonPanel>
    </div>
  </Shell>
</template>
