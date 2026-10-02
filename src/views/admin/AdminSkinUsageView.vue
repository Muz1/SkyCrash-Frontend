<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Plane, UserX } from '@lucide/vue'
import ReportLayout from '@/components/admin/ReportLayout.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminBarChart from '@/components/admin/AdminBarChart.vue'
import { getSkinUsage } from '@/services/adminAnalyticsService'
import { ABOUT } from '@/lib/reportAbout'
import { count, pct, prettyId } from '@/lib/reportFormat'
import type { SkinUsageReport } from '@/types/insights'

// A snapshot of what's equipped now, so no date range.
const data = ref<SkinUsageReport | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    data.value = await getSkinUsage()
  } catch {
    error.value = 'Skin usage could not be loaded.'
  }
})
</script>

<template>
  <ReportLayout
    title="Skin Usage"
    eyebrow="Cosmetics"
    subtitle="Which planes and skies players have equipped right now."
    :about="ABOUT.skins!"
    :ready="!!data"
    :error="error"
    :filter="false"
  >
    <template v-if="data">
      <div class="adm-kpis">
        <AdminKpi label="Players with a loadout" :icon="Plane" tone="lime" caption="Equipped in the hangar">
          <span class="adm-num">{{ count(data.playersWithLoadout) }}</span>
        </AdminKpi>
        <AdminKpi label="Never customised" :icon="UserX" tone="violet" caption="Flying the default jet and sky">
          <span class="adm-num">{{ count(data.playersWithoutLoadout) }}</span>
        </AdminKpi>
      </div>
      <div class="adm-grid-2">
        <AdminPanel title="Planes" caption="Players with each plane equipped" accent="blue">
          <AdminBarChart
            label="Players per equipped plane"
            value-label="Players"
            horizontal
            :items="data.planes.map((p) => ({ label: prettyId(p.label), value: p.count, detail: pct(p.percentage) }))"
            empty-text="No player has saved a loadout yet."
          />
        </AdminPanel>
        <AdminPanel title="Skies" caption="Players with each sky equipped" accent="ember">
          <AdminBarChart
            label="Players per equipped sky"
            value-label="Players"
            horizontal
            :tone="2"
            :items="data.skies.map((p) => ({ label: prettyId(p.label), value: p.count, detail: pct(p.percentage) }))"
            empty-text="No player has saved a loadout yet."
          />
        </AdminPanel>
      </div>
    </template>
  </ReportLayout>
</template>
