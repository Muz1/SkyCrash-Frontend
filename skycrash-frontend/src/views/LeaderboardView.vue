<script setup lang="ts">
import { onMounted } from 'vue'
import { useLeaderboardStore } from '@/stores/leaderboardStore'

const leaderboardStore = useLeaderboardStore()

onMounted(() => {
  leaderboardStore.fetchLeaderboard()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 px-4 py-6 sm:py-10 flex justify-center">
    <div class="w-full max-w-2xl space-y-8">
      <h1 class="text-2xl font-bold">Leaderboard</h1>

      <p v-if="leaderboardStore.isLoading && !leaderboardStore.data" class="text-slate-400">
        Loading…
      </p>

      <div v-if="leaderboardStore.data" class="grid gap-6 md:grid-cols-3">
        <section class="bg-slate-900 rounded-xl p-4">
          <h2 class="text-sm text-slate-400 mb-3">Biggest Wins</h2>
          <ol class="space-y-2 text-sm">
            <li
              v-for="(entry, i) in leaderboardStore.data.biggestWins"
              :key="i"
              class="flex justify-between"
            >
              <span>{{ i + 1 }}. {{ entry.username }}</span>
              <span class="text-emerald-400">{{ entry.payout }}</span>
            </li>
            <li v-if="leaderboardStore.data.biggestWins.length === 0" class="text-slate-500">
              No wins yet.
            </li>
          </ol>
        </section>

        <section class="bg-slate-900 rounded-xl p-4">
          <h2 class="text-sm text-slate-400 mb-3">Best Multipliers</h2>
          <ol class="space-y-2 text-sm">
            <li
              v-for="(entry, i) in leaderboardStore.data.bestMultipliers"
              :key="i"
              class="flex justify-between"
            >
              <span>{{ i + 1 }}. {{ entry.username }}</span>
              <span class="text-emerald-400">{{ entry.cashOutMultiplier.toFixed(2) }}x</span>
            </li>
            <li v-if="leaderboardStore.data.bestMultipliers.length === 0" class="text-slate-500">
              No cash-outs yet.
            </li>
          </ol>
        </section>

        <section class="bg-slate-900 rounded-xl p-4">
          <h2 class="text-sm text-slate-400 mb-3">Most Active</h2>
          <ol class="space-y-2 text-sm">
            <li
              v-for="(entry, i) in leaderboardStore.data.mostActive"
              :key="i"
              class="flex justify-between"
            >
              <span>{{ i + 1 }}. {{ entry.username }}</span>
              <span class="text-slate-300">{{ entry.betsPlaced }} bets</span>
            </li>
            <li v-if="leaderboardStore.data.mostActive.length === 0" class="text-slate-500">
              No bets yet.
            </li>
          </ol>
        </section>
      </div>
    </div>
  </div>
</template>
