<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Users, Radio, FileBarChart, Percent, Activity, ChartColumn } from '@lucide/vue'

const route = useRoute()

const tabs = [
  { to: '/admin', label: 'Players', icon: Users },
  { to: '/admin/rounds', label: 'Current Round', icon: Radio },
  { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
  { to: '/rtp', label: 'RTP & House Edge', icon: Percent },
  { to: '/ops', label: 'Operations', icon: Activity },
  { to: '/volatility', label: 'Volatility', icon: ChartColumn },
]
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
