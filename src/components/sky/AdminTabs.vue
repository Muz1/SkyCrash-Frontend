<script setup lang="ts">
import { useRoute } from 'vue-router'
import { cn } from '@/lib/cn'

const route = useRoute()

const tabs = [
  { to: '/admin', label: 'Players' },
  { to: '/admin/rounds', label: 'Current Round' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/rtp', label: 'RTP & House Edge' },
  { to: '/ops', label: 'Operations' },
  { to: '/volatility', label: 'Volatility' },
]
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      :class="
        cn(
          'clip-hud border-2 px-4 py-2 font-arcade text-[9px] uppercase tracking-[0.2em] transition-all duration-150',
          route.path === tab.to
            ? 'border-ember bg-[image:var(--grad-sunset)] text-void [box-shadow:var(--glow-ember)]'
            : 'border-violet/50 text-muted-foreground hover:border-electric hover:text-electric',
        )
      "
    >
      {{ tab.label }}
    </RouterLink>
  </div>
</template>
