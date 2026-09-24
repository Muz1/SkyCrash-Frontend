<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRtpStore } from '@/stores/rtpStore'
import { useAdminSettingsStore } from '@/stores/adminSettingsStore'
import AdminShell from '@/components/sky/AdminShell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ScoreDisplay from '@/components/sky/ScoreDisplay.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
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
    <div class="flex flex-wrap items-start justify-between gap-3">
      <h1 class="font-display text-2xl font-black uppercase tracking-[0.2em] text-ember text-glow-ember sm:text-3xl">
        RTP &amp; House Edge
      </h1>
      <ExportPdfButton :build="buildReport" />
    </div>

    <NeonPanel class="mt-5" title="House Edge Setting" accent="magenta">
      <div v-if="adminSettingsStore.settings" class="flex flex-wrap items-end gap-4">
        <label class="block">
          <span class="mb-1.5 block font-display text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
            House Edge %
          </span>
          <input
            v-model.number="houseEdgeInput"
            type="number"
            min="0"
            max="50"
            step="0.1"
            class="clip-hud w-32 border-2 border-violet/50 bg-void/70 px-3 py-2.5 text-sm text-foreground focus:border-magenta focus:outline-none"
          />
        </label>
        <ArcadeButton
          size="md"
          variant="danger"
          :disabled="houseEdgeInput === adminSettingsStore.settings.houseEdgePercentage"
          @click="showConfirmModal = true"
        >
          Save Change
        </ArcadeButton>
      </div>
      <p v-else class="text-muted-foreground">Loading current setting…</p>
      <p v-if="saveMessage" class="mt-3 font-arcade text-[8px] uppercase tracking-[0.2em] text-lime">{{ saveMessage }}</p>
      <p v-if="adminSettingsStore.settings" class="mt-3 text-xs text-muted-foreground">
        Currently {{ adminSettingsStore.settings.houseEdgePercentage }}% ({{ adminSettingsStore.settings.theoreticalRtpPercentage }}%
        theoretical RTP)
        <template v-if="adminSettingsStore.settings.updatedByUsername">
          — last changed by {{ adminSettingsStore.settings.updatedByUsername }} on
          {{ new Date(adminSettingsStore.settings.updatedAtUtc).toLocaleString() }}
        </template>
      </p>
    </NeonPanel>

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

    <HouseEdgeConfirmModal
      v-if="showConfirmModal"
      :new-house-edge-percentage="houseEdgeInput"
      @close="showConfirmModal = false"
      @saved="handleSaved"
    />
  </AdminShell>
</template>
