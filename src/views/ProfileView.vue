<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Shell from "@/components/sky/Shell.vue";
import NeonPanel from "@/components/sky/NeonPanel.vue";
import { useAuthStore } from "@/stores/auth";
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

const auth = useAuthStore();
const bets = ref<BetHistoryEntry[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    bets.value = await api.get<BetHistoryEntry[]>("/api/players/me/bet-history?page=1&pageSize=100");
  } finally {
    loading.value = false;
  }
});

const memberSince = computed(() => {
  const iso = auth.player?.memberSinceUtc;
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
});

const wins = computed(() => bets.value.filter((b) => b.status === "CashedOut").length);
const best = computed(() => bets.value.reduce((m, b) => Math.max(m, b.cashOutMultiplier ?? 0), 0));
const biggestCashOut = computed(() => bets.value.reduce((m, b) => Math.max(m, b.payout ?? 0), 0));

const stats = computed(() => [
  { label: "Total Flights", value: bets.value.length.toString() },
  { label: "Win Rate", value: `${Math.round((wins.value / Math.max(bets.value.length, 1)) * 100)}%` },
  { label: "Highest Multiplier", value: `${best.value.toFixed(2)}x` },
  { label: "Biggest Cash-Out", value: Math.round(biggestCashOut.value).toLocaleString() },
]);
</script>

<template>
  <Shell skin="deep-space" :dim="0.5">
    <div class="mx-auto w-full max-w-3xl">
      <h1 class="text-center font-display text-2xl font-black uppercase tracking-[0.2em] text-magenta text-glow-magenta sm:text-3xl">
        Pilot Profile
      </h1>

      <NeonPanel class="mt-6" accent="magenta">
        <div class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <div class="grid h-16 w-16 shrink-0 place-items-center border-2 border-electric bg-void/70 clip-hud font-arcade text-lg text-electric text-glow-blue">
            {{ (auth.player?.username ?? "??").slice(0, 2).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="truncate font-display text-xl font-black uppercase tracking-[0.18em] text-foreground">
              {{ auth.player?.username }}
            </p>
            <p class="font-arcade text-[8px] uppercase tracking-[0.3em] text-ember">Pilot since {{ memberSince }}</p>
          </div>
        </div>

        <dl class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div v-for="s in stats" :key="s.label" class="clip-hud border border-violet/40 bg-void/50 p-3">
            <dt class="font-arcade text-[7px] uppercase tracking-[0.24em] text-muted-foreground">{{ s.label }}</dt>
            <dd class="mt-1 font-arcade text-sm text-electric text-glow-blue">{{ loading ? "—" : s.value }}</dd>
          </div>
        </dl>
      </NeonPanel>
    </div>
  </Shell>
</template>
