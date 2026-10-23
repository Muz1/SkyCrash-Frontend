<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminPanel from './AdminPanel.vue'
import AdminButton from './AdminButton.vue'
import LimitsEditDialog from './LimitsEditDialog.vue'
import { KeyRound } from '@lucide/vue'
import { getRisk } from '@/services/adminOpsService'
import { usePublicSettingsStore } from '@/stores/publicSettingsStore'
import { zar } from '@/lib/reportFormat'
import type { GameLimits } from '@/types/admin'

/**
 * "How the caps work": the live limits from /admin/risk and the edge from the public rules,
 * with the worst-case maths. 1 credit = R1, so every figure here is in rands.
 */
const limits = ref<GameLimits | null>(null)
const publicSettings = usePublicSettingsStore()
const editing = ref(false)

async function loadLimits() {
  try {
    limits.value = (await getRisk()).limits
  } catch {
    limits.value = null
  }
}

onMounted(() => {
  void publicSettings.load()
  void loadLimits()
})

function onSaved() {
  void loadLimits()
  void publicSettings.refresh()
}

const edge = computed(() => publicSettings.rules?.houseEdgePercentage ?? null)

/** A minimum bet that reaches the top multiplier: the profit the house pays on it. */
const example = computed(() => {
  const l = limits.value
  if (!l) return null
  const stake = 100
  const profit = Math.min(stake * (l.maxMultiplier - 1), l.maxProfitPerBet)
  // The edge earns this % of every rand bet, so a win this size takes this much betting to earn back.
  const wageredToEarnBack = edge.value ? profit / (edge.value / 100) : null
  // The multiplier at which this stake hits the profit cap.
  const capMultiplier = 1 + l.maxProfitPerBet / stake
  return { stake, profit, wageredToEarnBack, capMultiplier }
})
</script>

<template>
  <AdminPanel title="How the caps work" caption="Why the house can still have a losing day, and how big a loss can get. 1 credit = R1." accent="ember">
    <template #actions>
      <AdminButton size="sm" @click="editing = true"><KeyRound aria-hidden="true" /> Change limits</AdminButton>
    </template>
    <p v-if="!limits" class="adm-subline">Loading the live limits…</p>
    <div v-else class="space-y-3 text-sm leading-relaxed">
      <dl class="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        <div>
          <dt class="adm-label !mb-0">Max multiplier: {{ limits.maxMultiplier }}×</dt>
          <dd>A round never flies past {{ limits.maxMultiplier }}×. Anyone still in at that point is paid at {{ limits.maxMultiplier }}×.</dd>
        </div>
        <div>
          <dt class="adm-label !mb-0">Max profit per bet: {{ zar(limits.maxProfitPerBet) }}</dt>
          <dd>
            A bet is cashed out automatically once its profit reaches {{ zar(limits.maxProfitPerBet) }}.
            Payout = the smaller of stake × multiplier and stake + {{ zar(limits.maxProfitPerBet) }}.
            <template v-if="example?.capMultiplier">A {{ zar(example.stake) }} bet hits this cap at {{ example.capMultiplier.toFixed(2) }}×.</template>
          </dd>
        </div>
        <div>
          <dt class="adm-label !mb-0">Round liability: {{ zar(limits.maxRoundLiability) }}</dt>
          <dd>If the bets still in the air would together pay {{ zar(limits.maxRoundLiability) }} or more at the current multiplier, they're all cashed out there.</dd>
        </div>
        <div>
          <dt class="adm-label !mb-0">Daily house loss limit: {{ zar(limits.dailyHouseLossLimit) }}</dt>
          <dd>When today's net gaming revenue (NGR) drops below −{{ zar(limits.dailyHouseLossLimit) }}, new bets pause until tomorrow (or until a manager resumes play).</dd>
        </div>
        <div>
          <dt class="adm-label !mb-0">Stakes: from {{ zar(limits.minBet) }}, no maximum</dt>
          <dd>Bets paid from bonus credits are capped at {{ zar(limits.maxBetFromBonusBalance) }}.</dd>
        </div>
        <div>
          <dt class="adm-label !mb-0">House edge: {{ edge != null ? `${edge}%` : '—' }}</dt>
          <dd>On average the house keeps {{ edge != null ? `${edge}%` : 'the edge' }} of every rand bet. That's an average over many bets, not a promise for any one day.</dd>
        </div>
      </dl>

      <p>
        <strong>Why revenue can be negative.</strong> The caps limit how much a loss can be. They don't stop losses happening.
        Players who cash out before the crash win, and a few big wins can beat the edge for days.
        <template v-if="example && example.wageredToEarnBack">
          Example: one {{ zar(example.stake) }} bet cashed out at {{ limits.maxMultiplier }}× costs the house {{ zar(example.profit) }}.
          At a {{ edge }}% edge, that takes about {{ zar(example.wageredToEarnBack) }} of betting to earn back.
        </template>
      </p>
      <p>
        <strong>Worst cases.</strong> One bet: {{ zar(limits.maxProfitPerBet) }}. One round: about {{ zar(limits.maxRoundLiability) }} in payouts.
        One day: about {{ zar(limits.dailyHouseLossLimit) }}, plus the round in the air when the limit is reached.
        Free and bonus credits count as a cost too, so they also push NGR down.
      </p>
    </div>
    <LimitsEditDialog v-if="editing" @close="editing = false" @saved="onSaved" />
  </AdminPanel>
</template>
