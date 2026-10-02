<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Users, Radio, FileBarChart, Percent, Activity, ChartColumn, ChartPie, ShieldCheck } from '@lucide/vue'
import { usePlayerStore } from '@/stores/playerStore'

const route = useRoute()
const playerStore = usePlayerStore()

const tabs = computed(() => [
  { to: '/admin', label: 'Players', icon: Users },
  { to: '/admin/rounds', label: 'Current Round', icon: Radio },
  { to: '/admin/analytics', label: 'Analytics', icon: ChartPie },
  { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
  { to: '/rtp', label: 'RTP & House Edge', icon: Percent },
  { to: '/ops', label: 'Operations', icon: Activity },
  { to: '/volatility', label: 'Volatility', icon: ChartColumn },
  // Only managers can change who has admin access.
  ...(playerStore.profile?.isManager ? [{ to: '/admin/roles', label: 'Admin Roles', icon: ShieldCheck }] : []),
])
</script>

<template>
  <div class="adm-tabs">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="adm-tab"
      :aria-current="route.path === tab.to ? 'page' : undefined"
    >
      <component :is="tab.icon" aria-hidden="true" />
      {{ tab.label }}
    </RouterLink>
  </div>
</template>
