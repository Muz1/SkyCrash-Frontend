<script setup lang="ts">
import { onMounted } from 'vue'
import { useLeaderboardStore } from '@/stores/leaderboardStore'
import Shell from '@/components/sky/Shell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import AchievementBadge from '@/components/sky/AchievementBadge.vue'

const leaderboardStore = useLeaderboardStore()

onMounted(() => {
  leaderboardStore.fetchLeaderboard()
})
</script>

<template>
  <Shell skin="johannesburg" :dim="0.55">
    <div class="mx-auto w-full max-w-4xl">
      <h1 class="text-center font-display text-2xl font-black uppercase tracking-[0.2em] text-ember text-glow-ember sm:text-3xl">
        Leaderboard
      </h1>
      <p class="mt-1 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Three ways to top the sky
      </p>

      <p v-if="leaderboardStore.isLoading && !leaderboardStore.data" class="mt-6 text-center text-muted-foreground">Loading…</p>

      <div v-if="leaderboardStore.data" class="mt-6 grid gap-4 sm:grid-cols-3">
        <NeonPanel title="Biggest Wins" accent="lime">
          <ol class="space-y-2 text-sm">
            <li
              v-for="(entry, i) in leaderboardStore.data.biggestWins"
              :key="i"
              class="flex items-center justify-between gap-2"
            >
              <span class="flex min-w-0 items-center gap-1.5 truncate text-muted-foreground">
                {{ i + 1 }}. <AchievementBadge :achievement-key="entry.displayedAchievementKey" size="xs" /> {{ entry.username }}
              </span>
              <span class="font-arcade text-xs text-lime text-glow-lime">+{{ entry.payout.toLocaleString() }}</span>
            </li>
            <li v-if="leaderboardStore.data.biggestWins.length === 0" class="text-muted-foreground">No wins yet.</li>
          </ol>
        </NeonPanel>

        <NeonPanel title="Best Multipliers" accent="blue">
          <ol class="space-y-2 text-sm">
            <li
              v-for="(entry, i) in leaderboardStore.data.bestMultipliers"
              :key="i"
              class="flex items-center justify-between gap-2"
            >
              <span class="flex min-w-0 items-center gap-1.5 truncate text-muted-foreground">
                {{ i + 1 }}. <AchievementBadge :achievement-key="entry.displayedAchievementKey" size="xs" /> {{ entry.username }}
              </span>
              <span class="font-arcade text-xs text-electric text-glow-blue">{{ entry.cashOutMultiplier.toFixed(2) }}x</span>
            </li>
            <li v-if="leaderboardStore.data.bestMultipliers.length === 0" class="text-muted-foreground">No cash-outs yet.</li>
          </ol>
        </NeonPanel>

        <NeonPanel title="Most Active" accent="magenta">
          <ol class="space-y-2 text-sm">
            <li
              v-for="(entry, i) in leaderboardStore.data.mostActive"
              :key="i"
              class="flex items-center justify-between gap-2"
            >
              <span class="flex min-w-0 items-center gap-1.5 truncate text-muted-foreground">
                {{ i + 1 }}. <AchievementBadge :achievement-key="entry.displayedAchievementKey" size="xs" /> {{ entry.username }}
              </span>
              <span class="font-arcade text-xs text-magenta text-glow-magenta">{{ entry.betsPlaced }} bets</span>
            </li>
            <li v-if="leaderboardStore.data.mostActive.length === 0" class="text-muted-foreground">No bets yet.</li>
          </ol>
        </NeonPanel>
      </div>
    </div>
  </Shell>
</template>
