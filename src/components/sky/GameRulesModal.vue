<script setup lang="ts">
import { computed } from 'vue'
import SkyModal from './SkyModal.vue'
import { usePublicSettingsStore } from '@/stores/publicSettingsStore'
import { creditAmount } from '@/lib/format'
import { en } from '@/copy/en'

/** The published game limits in one table (GET /api/settings/public → rules). */
const emit = defineEmits<{ close: [] }>()
const settings = usePublicSettingsStore()
const t = en.rulesModal

const rows = computed(() => {
  const r = settings.rules
  if (!r) return []
  return [
    { label: t.edge, value: `${r.houseEdgePercentage}%` },
    { label: t.rtp, value: `${r.theoreticalRtpPercentage}%` },
    { label: t.stake, value: `${creditAmount(r.minBet)} min, no max` },
    { label: t.maxMultiplier, value: `${r.maxMultiplier}x` },
    { label: t.maxProfit, value: creditAmount(r.maxProfitPerBet) },
    { label: t.roundCap, value: creditAmount(r.maxRoundLiability) },
    { label: t.bonusStake, value: creditAmount(r.maxBetFromBonusBalance) },
  ]
})
</script>

<template>
  <SkyModal :title="t.title" accent="blue" @close="emit('close')">
    <dl v-if="rows.length" class="divide-y divide-violet/30 border-y border-violet/30">
      <div v-for="row in rows" :key="row.label" class="flex items-baseline justify-between gap-3 py-2">
        <dt class="text-sm text-muted-foreground">{{ row.label }}</dt>
        <dd class="font-arcade text-[0.625rem] tabular-nums text-foreground">{{ row.value }}</dd>
      </div>
    </dl>
    <p v-else class="text-sm text-muted-foreground">{{ en.common.loading }}</p>
    <p class="mt-3 text-sm text-foreground/85">{{ t.capNote }}</p>
    <template #footer>
      <RouterLink
        to="/history?tab=rounds"
        class="clip-hud grid place-items-center border-2 border-electric/70 px-3 py-2 font-display text-[0.625rem] font-black uppercase tracking-[0.16em] text-electric pointer-coarse:min-h-11 hover:[box-shadow:var(--glow-blue)]"
        @click="emit('close')"
      >
        {{ t.fairLink }}
      </RouterLink>
      <RouterLink
        to="/rules"
        class="clip-hud grid place-items-center border-2 border-magenta/70 px-3 py-2 font-display text-[0.625rem] font-black uppercase tracking-[0.16em] text-magenta pointer-coarse:min-h-11 hover:[box-shadow:var(--glow-magenta)]"
        @click="emit('close')"
      >
        {{ t.accountRules }}
      </RouterLink>
    </template>
  </SkyModal>
</template>
