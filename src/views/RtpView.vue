<script setup lang="ts">
import { onMounted } from 'vue'
import { useRtpStore } from '@/stores/rtpStore'

const rtpStore = useRtpStore()

onMounted(() => {
  rtpStore.fetchSummary()
})
</script>

<template>
  <div class="min-h-screen bg-background text-text-primary px-4 py-10 flex justify-center">
    <div class="w-full max-w-2xl space-y-6">
      <h1 class="text-2xl font-bold">RTP Dashboard</h1>

      <div v-if="rtpStore.summary" class="space-y-6">
        <div class="bg-surface rounded-xl p-4">
          <div class="text-xs text-text-muted">Theoretical RTP (house edge {{ rtpStore.summary.houseEdgePercentage }}%)</div>
          <div class="text-3xl font-bold">{{ rtpStore.summary.theoreticalRtpPercentage }}%</div>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <div class="bg-surface rounded-xl p-4 space-y-2">
            <h2 class="text-sm text-text-muted">All-Time</h2>
            <div class="text-2xl font-bold">{{ rtpStore.summary.allTime.actualRtpPercentage }}%</div>
            <div class="text-xs text-text-muted">
              {{ rtpStore.summary.allTime.betsResolved }} bets · wagered {{ rtpStore.summary.allTime.totalWagered }} · paid out {{ rtpStore.summary.allTime.totalPaidOut }}
            </div>
          </div>
          <div class="bg-surface rounded-xl p-4 space-y-2">
            <h2 class="text-sm text-text-muted">Last 24 Hours</h2>
            <div class="text-2xl font-bold">{{ rtpStore.summary.last24Hours.actualRtpPercentage }}%</div>
            <div class="text-xs text-text-muted">
              {{ rtpStore.summary.last24Hours.betsResolved }} bets · wagered {{ rtpStore.summary.last24Hours.totalWagered }} · paid out {{ rtpStore.summary.last24Hours.totalPaidOut }}
            </div>
          </div>
        </div>
      </div>

      <p v-else class="text-text-muted">Loading…</p>
    </div>
  </div>
</template>
