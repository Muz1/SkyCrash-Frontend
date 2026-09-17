<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAdminRoundStore } from '@/stores/adminRoundStore'
import AdminShell from '@/components/sky/AdminShell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ScoreDisplay from '@/components/sky/ScoreDisplay.vue'

const adminRoundStore = useAdminRoundStore()

onMounted(() => {
  adminRoundStore.startPolling()
})

onUnmounted(() => {
  adminRoundStore.stopPolling()
})
</script>

<template>
  <AdminShell
    help-text="This page reveals the current round's already-determined crash multiplier before it happens — useful for oversight and auditing. There is deliberately no way to edit it anywhere in the system: the outcome is generated once at round start and locked in from then on."
  >
    <h1 class="font-display text-2xl font-black uppercase tracking-[0.2em] text-ember text-glow-ember sm:text-3xl">
      Current Round
    </h1>

    <div v-if="adminRoundStore.round" class="mt-5 space-y-4">
      <NeonPanel accent="magenta" title="Live State">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ScoreDisplay label="Round" tone="magenta">#{{ adminRoundStore.round.roundNumber }}</ScoreDisplay>
          <ScoreDisplay label="Status" tone="blue">{{ adminRoundStore.round.status }}</ScoreDisplay>
          <ScoreDisplay label="Live Multiplier" tone="lime">{{ adminRoundStore.round.currentMultiplier.toFixed(2) }}x</ScoreDisplay>
          <ScoreDisplay label="Active Bets" tone="blue">{{ adminRoundStore.round.activeBetCount }}</ScoreDisplay>
        </div>
      </NeonPanel>

      <NeonPanel accent="ember" title="Predetermined Outcome (Admin-Only, Read-Only)">
        <ScoreDisplay label="Locked Crash Multiplier" tone="ember">
          {{ adminRoundStore.round.predeterminedCrashMultiplier.toFixed(2) }}x
        </ScoreDisplay>
        <p class="mt-3 text-center text-xs text-muted-foreground">
          Generated once from the round's server seed the instant it started running — there is no admin action anywhere
          that can change this value. Do not disclose this to players; it defeats the game.
        </p>
      </NeonPanel>

      <NeonPanel accent="blue" title="Provably Fair Seed">
        <p class="break-all text-center font-arcade text-[10px] text-muted-foreground">
          {{ adminRoundStore.round.serverSeedHash }}
        </p>
        <p class="mt-2 text-center text-xs text-muted-foreground">
          Server seed hash, published to players at round start. The seed itself is revealed to everyone once the round
          crashes, letting anyone verify the outcome independently.
        </p>
      </NeonPanel>
    </div>

    <p v-else class="mt-6 text-muted-foreground">No round is currently active.</p>
  </AdminShell>
</template>
