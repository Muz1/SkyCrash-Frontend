<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Download, ShieldCheck, ShieldAlert } from '@lucide/vue'
import NeonPanel from './NeonPanel.vue'
import InfoTip from './InfoTip.vue'
import ArcadeButton from './ArcadeButton.vue'
import AppealForm from './AppealForm.vue'
import { useRulesStore } from '@/stores/rulesStore'
import { downloadRulesPdf, effectiveDate } from '@/lib/rulesPdf'
import { dateShort } from '@/lib/format'
import type { AccountStatus } from '@/types'
import { en } from '@/copy/en'

/**
 * Profile: account status badge (GET /api/rules/me), any active sanction (rule, end date or
 * Permanent, Appeal when allowed), and the Account rules card (version, PDF, link).
 */
const rulesStore = useRulesStore()
const t = en.standing
const appealing = ref<string | null>(null)
const downloading = ref(false)

onMounted(() => {
  void rulesStore.loadStanding()
  void rulesStore.loadRules()
})

const status = computed<AccountStatus>(() => rulesStore.standing?.status ?? 'GoodStanding')
const BADGE: Record<AccountStatus, string> = {
  GoodStanding: 'border-lime text-lime',
  Warning: 'border-ember text-ember',
  Restricted: 'border-magenta text-magenta',
  Blocked: 'border-danger text-danger',
}

async function download() {
  if (!rulesStore.ruleSet) return
  downloading.value = true
  try {
    await downloadRulesPdf(rulesStore.ruleSet)
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <NeonPanel id="account-status" class="scroll-mt-4" :title="t.title" accent="lime">
    <div class="flex items-center gap-2">
      <span :class="['clip-hud inline-flex items-center gap-1.5 border-2 px-2 py-1 font-arcade text-[0.5rem] uppercase', BADGE[status]]">
        <ShieldCheck v-if="status === 'GoodStanding'" class="h-3.5 w-3.5" aria-hidden="true" />
        <ShieldAlert v-else class="h-3.5 w-3.5" aria-hidden="true" />
        {{ t[status] }}
      </span>
      <InfoTip :text="t.info" :label="t.title" />
    </div>

    <ul v-if="rulesStore.standing?.activeSanctions.length" class="mt-3 space-y-3">
      <li v-for="s in rulesStore.standing.activeSanctions" :key="s.id" class="border-2 border-violet/40 bg-void/50 p-3">
        <p class="text-sm font-semibold text-foreground">
          <span class="font-arcade text-[0.5625rem] text-electric">{{ s.ruleCode }}</span> · {{ s.ruleTitle }}
        </p>
        <p class="text-sm text-foreground/80">{{ s.ruleSummary }}</p>
        <p class="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">
          {{ s.endsAtUtc ? t.ends(dateShort(s.endsAtUtc)) : en.common.permanent }}
        </p>
        <div v-if="s.appealable" class="mt-2">
          <AppealForm v-if="appealing === s.id || s.appealPending" :sanction-id="s.id" :pending="s.appealPending" />
          <ArcadeButton v-else type="button" size="sm" variant="magenta" @click="appealing = s.id">{{ t.appeal }}</ArcadeButton>
        </div>
      </li>
    </ul>

    <div class="mt-4 border-t border-violet/40 pt-3">
      <p class="font-display text-[0.625rem] font-black uppercase tracking-[0.28em] text-magenta">{{ t.rulesCard }}</p>
      <p v-if="rulesStore.ruleSet" class="mt-1 text-sm text-foreground/85">
        {{ en.rules.version(rulesStore.ruleSet.label) }} · {{ effectiveDate(rulesStore.ruleSet.effectiveFromUtc) }}
      </p>
      <div class="mt-2 flex flex-wrap gap-2">
        <ArcadeButton type="button" size="sm" variant="blue" :disabled="!rulesStore.ruleSet || downloading" @click="download">
          <Download class="h-3.5 w-3.5" aria-hidden="true" /> {{ en.rules.download }}
        </ArcadeButton>
        <RouterLink
          to="/rules"
          class="clip-hud grid place-items-center border-2 border-magenta/70 px-3 py-1.5 font-display text-[0.625rem] font-black uppercase tracking-[0.14em] text-magenta pointer-coarse:min-h-11 hover:[box-shadow:var(--glow-magenta)]"
        >
          {{ t.viewRules }}
        </RouterLink>
      </div>
    </div>
  </NeonPanel>
</template>
