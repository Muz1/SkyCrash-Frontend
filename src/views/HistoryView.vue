<script setup lang="ts">
import { onMounted, ref } from "vue";
import Shell from "@/components/sky/Shell.vue";
import ArcadeButton from "@/components/sky/ArcadeButton.vue";
import NeonPanel from "@/components/sky/NeonPanel.vue";
import StatusBadge from "@/components/sky/StatusBadge.vue";
import { api } from "@/lib/api";

interface BetHistoryEntry {
  betId: string;
  roundNumber: number;
  amount: number;
  status: "CashedOut" | "Lost" | "Placed";
  cashOutMultiplier: number | null;
  payout: number | null;
  placedAtUtc: string;
}

const bets = ref<BetHistoryEntry[]>([]);
const loading = ref(true);

function statusLabel(status: BetHistoryEntry["status"]): "CASHED OUT" | "CRASHED" {
  return status === "CashedOut" ? "CASHED OUT" : "CRASHED";
}

function result(bet: BetHistoryEntry) {
  return bet.status === "CashedOut" ? (bet.payout ?? 0) - bet.amount : -bet.amount;
}

function formatDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    .toUpperCase();
}

onMounted(async () => {
  try {
    bets.value = await api.get<BetHistoryEntry[]>("/api/players/me/bet-history?page=1&pageSize=50");
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <Shell skin="sunset-runway" :dim="0.65">
    <div class="mx-auto w-full max-w-3xl">
      <h1 class="text-center font-display text-2xl font-black uppercase tracking-[0.2em] text-electric text-glow-blue sm:text-3xl">
        Flight History
      </h1>

      <NeonPanel v-if="!loading && bets.length === 0" class="mt-6 text-center" accent="blue">
        <p class="font-arcade text-sm text-magenta text-glow-magenta">No flights yet</p>
        <p class="mt-2 text-sm text-muted-foreground">Your first flight is waiting.</p>
        <RouterLink to="/play" class="mt-5 inline-block">
          <ArcadeButton size="lg">Take Off</ArcadeButton>
        </RouterLink>
      </NeonPanel>

      <ul v-else class="mt-6 space-y-3">
        <li
          v-for="f in bets"
          :key="f.betId"
          class="neon-panel clip-hud grid grid-cols-2 gap-3 p-4 sm:grid-cols-5 sm:items-center"
        >
          <div class="min-w-0">
            <p class="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">Round</p>
            <p class="truncate font-arcade text-[10px] text-foreground">#{{ f.roundNumber }}</p>
          </div>
          <div>
            <p class="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">Bet</p>
            <p class="font-arcade text-[10px] text-ember">{{ f.amount.toLocaleString() }}</p>
          </div>
          <div>
            <p class="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">Multiplier</p>
            <p class="font-arcade text-[10px] text-electric">
              {{ f.cashOutMultiplier ? `${f.cashOutMultiplier.toFixed(2)}x` : "—" }}
            </p>
          </div>
          <div>
            <p class="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">Result</p>
            <p class="font-arcade text-[10px]" :class="result(f) >= 0 ? 'text-lime text-glow-lime' : 'text-danger'">
              {{ result(f) >= 0 ? "+" : "" }}{{ result(f).toLocaleString() }}
            </p>
          </div>
          <div class="flex items-center justify-between gap-2 sm:justify-end">
            <StatusBadge :status="statusLabel(f.status)" />
            <span class="font-arcade text-[7px] text-muted-foreground">{{ formatDate(f.placedAtUtc) }}</span>
          </div>
        </li>
      </ul>
    </div>
  </Shell>
</template>
