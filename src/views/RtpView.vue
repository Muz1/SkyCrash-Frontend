<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Percent, History, Clock, ShieldAlert, CircleCheck } from '@lucide/vue'
import { useRtpStore } from '@/stores/rtpStore'
import { useAdminSettingsStore } from '@/stores/adminSettingsStore'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminLoading from '@/components/admin/AdminLoading.vue'
import HouseEdgeConfirmModal from '@/components/HouseEdgeConfirmModal.vue'
import ExportPdfButton from '@/components/sky/ExportPdfButton.vue'
import { buildRtpReport } from '@/lib/adminReports'

const rtpStore = useRtpStore()
const adminSettingsStore = useAdminSettingsStore()

const houseEdgeInput = ref(1)
const showConfirmModal = ref(false)
const saveMessage = ref('')

function buildReport() {
  return rtpStore.summary ? buildRtpReport(rtpStore.summary, adminSettingsStore.settings) : null
}

// Display only: how far the actual payout rate sits from the theoretical one.
function deltaVsTheoretical(actual: number) {
  if (!rtpStore.summary) return ''
  const d = actual - rtpStore.summary.theoreticalRtpPercentage
  return `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(2)} pts vs theoretical`
}

// Display only: a symmetric deviation scale centred on the theoretical RTP.
const rtpChart = computed(() => {
  const summary = rtpStore.summary
  if (!summary) return { rows: [], ticks: [] }
  const target = summary.theoreticalRtpPercentage
  const windows = [
    { label: 'All-Time', value: summary.allTime.actualRtpPercentage, color: 'var(--neon-blue)' },
    { label: 'Last 24 Hours', value: summary.last24Hours.actualRtpPercentage, color: 'var(--neon-lime)' },
  ]
  const maxDev = Math.max(0.5, ...windows.map((w) => Math.abs(w.value - target)))
  const NICE = [0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100]
  const span = NICE.find((n) => n >= maxDev * 1.15) ?? Math.ceil(maxDev)
  const toPos = (v: number) => 50 + ((v - target) / span) * 50
  const fmt = (v: number) => `${Number(v.toFixed(2))}%`
  return {
    rows: windows.map((w) => ({ ...w, pos: Math.max(0, Math.min(100, toPos(w.value))) })),
    ticks: [-1, -0.5, 0, 0.5, 1].map((k) => ({ pos: 50 + k * 50, label: fmt(target + k * span) })),
  }
})

onMounted(async () => {
  rtpStore.fetchSummary()
  await adminSettingsStore.fetchSettings()
  if (adminSettingsStore.settings) {
    houseEdgeInput.value = adminSettingsStore.settings.houseEdgePercentage
  }
})

function handleSaved() {
  showConfirmModal.value = false
  saveMessage.value = 'House edge updated.'
  rtpStore.fetchSummary()
  setTimeout(() => (saveMessage.value = ''), 4000)
}
</script>

<template>
  <AdminShell
    help-text="Theoretical RTP is derived directly from the configured house edge — it's the payout rate the math guarantees over the long run. All-Time / Last 24 Hours show the ACTUAL rate paid out to real players, for comparison. Changing the house edge affects every round from the moment it's saved onward, and requires re-entering your password to confirm — it never changes a round already in progress."
  >
    <AdminPage :page-export="false"
      title="RTP & House Edge"
      eyebrow="Game economics"
      subtitle="Configured house edge versus the return-to-player actually paid out."
    >
      <template #actions>
        <ExportPdfButton :build="buildReport" />
      </template>

      <div v-if="rtpStore.summary" class="grid shrink-0 gap-4 md:grid-cols-3">
        <AdminKpi
          label="Theoretical RTP"
          :icon="Percent"
          tone="ember"
          :caption="`House edge ${rtpStore.summary.houseEdgePercentage}% — the long-run payout rate the math guarantees`"
          large
        >
          <span class="adm-num">{{ rtpStore.summary.theoreticalRtpPercentage }}%</span>
        </AdminKpi>
        <AdminKpi label="All-Time · Actual RTP" :icon="History" tone="blue" large>
          <span class="adm-num">{{ rtpStore.summary.allTime.actualRtpPercentage }}%</span>
          <template #caption>
            <span class="adm-num">
              {{ rtpStore.summary.allTime.betsResolved }} bets · wagered {{ rtpStore.summary.allTime.totalWagered }} · paid
              out {{ rtpStore.summary.allTime.totalPaidOut }}
            </span>
          </template>
        </AdminKpi>
        <AdminKpi label="Last 24 Hours · Actual RTP" :icon="Clock" tone="lime" large>
          <span class="adm-num">{{ rtpStore.summary.last24Hours.actualRtpPercentage }}%</span>
          <template #caption>
            <span class="adm-num">
              {{ rtpStore.summary.last24Hours.betsResolved }} bets · wagered
              {{ rtpStore.summary.last24Hours.totalWagered }} · paid out {{ rtpStore.summary.last24Hours.totalPaidOut }}
            </span>
          </template>
        </AdminKpi>
      </div>

      <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
        <AdminPanel title="House Edge Setting" accent="magenta" fill>
          <div v-if="adminSettingsStore.settings" class="flex flex-col gap-4">
            <div class="flex items-end gap-3">
              <label class="block flex-1">
                <span class="adm-label">House Edge %</span>
                <div class="relative">
                  <input
                    v-model.number="houseEdgeInput"
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    class="adm-input adm-num w-full !pr-9 !text-[16px] !font-semibold"
                  />
                  <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--adm-text-3)]">%</span>
                </div>
              </label>
              <AdminButton
                variant="danger-solid"
                :disabled="houseEdgeInput === adminSettingsStore.settings.houseEdgePercentage"
                @click="showConfirmModal = true"
              >
                Save Change
              </AdminButton>
            </div>
            <p v-if="saveMessage" class="adm-success flex items-center gap-2">
              <CircleCheck class="h-4 w-4" aria-hidden="true" />{{ saveMessage }}
            </p>
            <p class="adm-note">
              Currently <strong class="adm-num text-[var(--adm-text)]">{{ adminSettingsStore.settings.houseEdgePercentage }}%</strong>
              (<span class="adm-num">{{ adminSettingsStore.settings.theoreticalRtpPercentage }}%</span> theoretical RTP)
              <template v-if="adminSettingsStore.settings.updatedByUsername">
                — last changed by {{ adminSettingsStore.settings.updatedByUsername }} on
                {{ new Date(adminSettingsStore.settings.updatedAtUtc).toLocaleString() }}
              </template>
            </p>
            <p class="adm-callout">
              <ShieldAlert aria-hidden="true" />
              <span>Applies to every new round once saved and requires your password. Rounds in progress are unaffected.</span>
            </p>
          </div>
          <AdminLoading v-else text="Loading current setting…" />
        </AdminPanel>

        <AdminPanel
          v-if="rtpStore.summary"
          title="Actual vs Theoretical RTP"
          caption="Distance of the actual payout rate from the configured target, in percentage points"
          accent="ember"
          fill
        >
          <div class="flex min-h-0 flex-1 flex-col justify-center gap-2">
            <div class="flex items-end gap-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--adm-text-3)]">
              <span class="w-36 shrink-0">Window</span>
              <div class="relative h-5 flex-1">
                <span
                  v-for="t in rtpChart.ticks"
                  :key="t.pos"
                  class="adm-num absolute bottom-0 -translate-x-1/2 whitespace-nowrap normal-case tracking-normal"
                  :class="t.pos === 50 ? 'text-[var(--neon-orange)]' : ''"
                  :style="{ left: t.pos + '%' }"
                >
                  {{ t.label }}
                </span>
              </div>
              <span class="w-28 shrink-0 text-right">Deviation</span>
            </div>
            <ul class="flex flex-col">
              <li
                v-for="row in rtpChart.rows"
                :key="row.label"
                class="flex items-center gap-4 border-t border-[var(--adm-border)] py-5"
                :title="`${row.label}: ${row.value}% actual vs ${rtpStore.summary.theoreticalRtpPercentage}% theoretical`"
              >
                <span class="w-36 shrink-0">
                  <span class="block text-[15px] font-semibold text-[var(--adm-text)]">{{ row.label }}</span>
                  <span class="adm-num block text-[13px] text-[var(--adm-text-3)]">{{ row.value }}% actual</span>
                </span>
                <div class="relative h-8 flex-1">
                  <span
                    v-for="t in rtpChart.ticks"
                    :key="t.pos"
                    class="absolute inset-y-0 w-px"
                    :class="t.pos === 50 ? 'bg-[oklch(0.76_0.19_55/0.7)]' : 'bg-[var(--adm-border)]'"
                    :style="{ left: t.pos + '%' }"
                  />
                  <span
                    class="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full opacity-60"
                    :style="{
                      left: Math.min(50, row.pos) + '%',
                      width: Math.abs(row.pos - 50) + '%',
                      background: row.color,
                    }"
                  />
                  <span
                    class="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    :style="{ left: row.pos + '%', background: row.color, boxShadow: `0 0 0 3px var(--adm-surface), 0 0 10px ${row.color}` }"
                  />
                </div>
                <span class="adm-num w-28 shrink-0 text-right text-[15px] font-semibold text-[var(--adm-text)]">
                  {{ deltaVsTheoretical(row.value).replace(' vs theoretical', '') }}
                </span>
              </li>
            </ul>
            <p class="adm-note border-t border-[var(--adm-border)] pt-3">
              The orange line is the theoretical RTP. Points left of it mean players were paid less than the long-run target
              over that window; points to the right mean more. Short windows naturally swing further.
            </p>
          </div>
        </AdminPanel>
        <AdminPanel v-else fill>
          <AdminLoading />
        </AdminPanel>
      </div>
    </AdminPage>

    <HouseEdgeConfirmModal
      v-if="showConfirmModal"
      :new-house-edge-percentage="houseEdgeInput"
      @close="showConfirmModal = false"
      @saved="handleSaved"
    />
  </AdminShell>
</template>
