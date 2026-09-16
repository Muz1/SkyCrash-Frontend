<script setup lang="ts">
import { onMounted, ref } from "vue";
import Shell from "@/components/sky/Shell.vue";
import NeonPanel from "@/components/sky/NeonPanel.vue";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface BiggestWinEntry {
  username: string;
  payout: number;
  cashOutMultiplier: number;
  roundNumber: number;
}
interface BestMultiplierEntry {
  username: string;
  cashOutMultiplier: number;
  roundNumber: number;
}
interface MostActiveEntry {
  username: string;
  betsPlaced: number;
}
interface LeaderboardResponse {
  biggestWins: BiggestWinEntry[];
  bestMultipliers: BestMultiplierEntry[];
  mostActive: MostActiveEntry[];
}

const TABS = ["Biggest Wins", "Best Multipliers", "Most Active"] as const;
const tab = ref<(typeof TABS)[number]>("Biggest Wins");
const leaderboard = ref<LeaderboardResponse>({ biggestWins: [], bestMultipliers: [], mostActive: [] });
const loading = ref(true);

onMounted(async () => {
  try {
    leaderboard.value = await api.get<LeaderboardResponse>("/api/leaderboard");
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <Shell skin="cloud-city" :dim="0.6">
    <div class="mx-auto w-full max-w-3xl">
      <h1 class="text-center font-display text-2xl font-black uppercase tracking-[0.2em] text-ember text-glow-ember sm:text-3xl">
        Sky Crash Leaderboard
      </h1>

      <div class="mt-5 flex flex-wrap justify-center gap-2">
        <button
          v-for="t in TABS"
          :key="t"
          class="clip-hud border-2 px-3 py-1.5 font-arcade text-[8px] uppercase transition-all"
          :class="
            tab === t
              ? 'border-magenta text-magenta [box-shadow:var(--glow-magenta)]'
              : 'border-violet/50 text-muted-foreground hover:border-electric hover:text-electric'
          "
          @click="tab = t"
        >
          {{ t }}
        </button>
      </div>

      <NeonPanel class="mt-6" accent="ember">
        <p v-if="loading" class="text-center font-arcade text-[10px] uppercase text-muted-foreground">Loading…</p>

        <ul v-else-if="tab === 'Biggest Wins'" class="space-y-2">
          <li
            v-for="(r, i) in leaderboard.biggestWins"
            :key="`${r.username}-${r.roundNumber}`"
            class="clip-hud grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border border-violet/40 bg-void/50 px-3 py-2.5"
          >
            <span :class="cn('font-arcade text-[10px]', i === 0 ? 'text-ember text-glow-ember' : i < 3 ? 'text-magenta' : 'text-muted-foreground')">
              #{{ i + 1 }}
            </span>
            <span class="truncate font-display text-sm font-black uppercase tracking-[0.18em] text-foreground">{{ r.username }}</span>
            <span class="font-arcade text-[10px] text-electric text-glow-blue">+{{ Math.round(r.payout).toLocaleString() }}</span>
          </li>
          <li v-if="leaderboard.biggestWins.length === 0" class="text-center font-arcade text-[10px] uppercase text-muted-foreground">
            No flights recorded yet.
          </li>
        </ul>

        <ul v-else-if="tab === 'Best Multipliers'" class="space-y-2">
          <li
            v-for="(r, i) in leaderboard.bestMultipliers"
            :key="`${r.username}-${r.roundNumber}`"
            class="clip-hud grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border border-violet/40 bg-void/50 px-3 py-2.5"
          >
            <span :class="cn('font-arcade text-[10px]', i === 0 ? 'text-ember text-glow-ember' : i < 3 ? 'text-magenta' : 'text-muted-foreground')">
              #{{ i + 1 }}
            </span>
            <span class="truncate font-display text-sm font-black uppercase tracking-[0.18em] text-foreground">{{ r.username }}</span>
            <span class="font-arcade text-[10px] text-electric text-glow-blue">{{ r.cashOutMultiplier.toFixed(2) }}x</span>
          </li>
          <li v-if="leaderboard.bestMultipliers.length === 0" class="text-center font-arcade text-[10px] uppercase text-muted-foreground">
            No flights recorded yet.
          </li>
        </ul>

        <ul v-else class="space-y-2">
          <li
            v-for="(r, i) in leaderboard.mostActive"
            :key="r.username"
            class="clip-hud grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border border-violet/40 bg-void/50 px-3 py-2.5"
          >
            <span :class="cn('font-arcade text-[10px]', i === 0 ? 'text-ember text-glow-ember' : i < 3 ? 'text-magenta' : 'text-muted-foreground')">
              #{{ i + 1 }}
            </span>
            <span class="truncate font-display text-sm font-black uppercase tracking-[0.18em] text-foreground">{{ r.username }}</span>
            <span class="font-arcade text-[10px] text-electric text-glow-blue">{{ r.betsPlaced }} bets</span>
          </li>
          <li v-if="leaderboard.mostActive.length === 0" class="text-center font-arcade text-[10px] uppercase text-muted-foreground">
            No flights recorded yet.
          </li>
        </ul>
      </NeonPanel>
    </div>
  </Shell>
</template>
