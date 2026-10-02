<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Hash, Radio, TrendingUp, Users, Lock, TriangleAlert, ShieldCheck } from '@lucide/vue'
import { useAdminRoundStore } from '@/stores/adminRoundStore'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminPill from '@/components/admin/AdminPill.vue'

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
    <AdminPage title="Current Round" eyebrow="Live oversight" subtitle="Real-time view of the round in progress. Refreshes automatically.">
      <template v-if="adminRoundStore.round">
        <div class="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
          <AdminKpi label="Round" :icon="Hash" tone="magenta">
            <span class="adm-num">#{{ adminRoundStore.round.roundNumber }}</span>
          </AdminKpi>
          <AdminKpi label="Status" :icon="Radio" tone="blue">
            <AdminPill :label="adminRoundStore.round.status" class="!h-8 !px-3 !text-[17px]" />
          </AdminKpi>
          <AdminKpi label="Live Multiplier" :icon="TrendingUp" tone="lime">
            <span class="adm-num">{{ adminRoundStore.round.currentMultiplier.toFixed(2) }}x</span>
          </AdminKpi>
          <AdminKpi label="Active Bets" :icon="Users" tone="violet">
            <span class="adm-num">{{ adminRoundStore.round.activeBetCount }}</span>
          </AdminKpi>
        </div>

        <div class="grid min-h-0 gap-4 lg:grid-cols-2">
          <AdminPanel title="Predetermined Outcome (Admin-Only, Read-Only)" accent="ember">
            <div class="flex h-full flex-col justify-between gap-4">
              <div class="flex items-center gap-4">
                <span
                  class="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-[oklch(0.76_0.19_55/0.3)] bg-[oklch(0.76_0.19_55/0.1)] text-[var(--neon-orange)]"
                  aria-hidden="true"
                >
                  <Lock class="h-6 w-6" />
                </span>
                <div>
                  <p class="adm-kpi-label">Locked Crash Multiplier</p>
                  <p class="adm-num text-[44px] font-bold leading-none text-[var(--neon-orange)]">
                    {{ adminRoundStore.round.predeterminedCrashMultiplier.toFixed(2) }}x
                  </p>
                </div>
              </div>
              <p class="adm-callout">
                <TriangleAlert aria-hidden="true" />
                <span>
                  Generated once from the round's server seed the instant it started running — there is no admin action
                  anywhere that can change this value. Do not disclose this to players; it defeats the game.
                </span>
              </p>
            </div>
          </AdminPanel>

          <AdminPanel title="Provably Fair Seed" accent="blue">
            <div class="flex h-full flex-col justify-between gap-4">
              <div>
                <p class="adm-label">Server seed hash</p>
                <p
                  class="adm-mono break-all rounded-lg border border-[var(--adm-border)] bg-[var(--adm-field)] px-4 py-3 leading-relaxed text-[var(--adm-text-2)]"
                >
                  {{ adminRoundStore.round.serverSeedHash }}
                </p>
              </div>
              <p class="adm-callout adm-callout--info">
                <ShieldCheck aria-hidden="true" />
                <span>
                  Server seed hash, published to players at round start. The seed itself is revealed to everyone once the
                  round crashes, letting anyone verify the outcome independently.
                </span>
              </p>
            </div>
          </AdminPanel>
        </div>
      </template>

      <AdminPanel v-else fill>
        <div class="adm-state">No round is currently active.</div>
      </AdminPanel>
    </AdminPage>
  </AdminShell>
</template>
