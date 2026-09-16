<script setup lang="ts">
import { onMounted } from 'vue'
import { useRtpStore } from '@/stores/rtpStore'
import Shell from '@/components/sky/Shell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ScoreDisplay from '@/components/sky/ScoreDisplay.vue'
import AdminTabs from '@/components/sky/AdminTabs.vue'

const rtpStore = useRtpStore()

onMounted(() => {
  rtpStore.fetchSummary()
})
</script>

<template>
  <Shell skin="midnight" :dim="0.65">
    <div class="mx-auto w-full max-w-2xl">
      <h1 class="font-display text-2xl font-black uppercase tracking-[0.2em] text-ember text-glow-ember sm:text-3xl">
        RTP Dashboard
      </h1>
      <div class="mt-4"><AdminTabs /></div>

      <div v-if="rtpStore.summary" class="mt-5 space-y-4">
        <NeonPanel accent="ember" :title="`Theoretical RTP (house edge ${rtpStore.summary.houseEdgePercentage}%)`">
          <ScoreDisplay tone="ember">{{ rtpStore.summary.theoreticalRtpPercentage }}%</ScoreDisplay>
        </NeonPanel>

        <div class="grid gap-4 sm:grid-cols-2">
          <NeonPanel title="All-Time" accent="blue">
            <ScoreDisplay tone="blue">{{ rtpStore.summary.allTime.actualRtpPercentage }}%</ScoreDisplay>
            <p class="mt-3 text-center text-xs text-muted-foreground">
              {{ rtpStore.summary.allTime.betsResolved }} bets · wagered {{ rtpStore.summary.allTime.totalWagered }} · paid out
              {{ rtpStore.summary.allTime.totalPaidOut }}
            </p>
          </NeonPanel>
          <NeonPanel title="Last 24 Hours" accent="lime">
            <ScoreDisplay tone="lime">{{ rtpStore.summary.last24Hours.actualRtpPercentage }}%</ScoreDisplay>
            <p class="mt-3 text-center text-xs text-muted-foreground">
              {{ rtpStore.summary.last24Hours.betsResolved }} bets · wagered {{ rtpStore.summary.last24Hours.totalWagered }} · paid
              out {{ rtpStore.summary.last24Hours.totalPaidOut }}
            </p>
          </NeonPanel>
        </div>
      </div>

      <p v-else class="mt-6 text-muted-foreground">Loading…</p>
    </div>
  </Shell>
</template>
