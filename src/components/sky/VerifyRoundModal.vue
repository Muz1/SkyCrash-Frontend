<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SkyModal from './SkyModal.vue'
import InfoTip from './InfoTip.vue'
import * as historyService from '@/services/historyService'
import { verifyRound, type VerifyResult } from '@/lib/verifyRound'
import { multiplier } from '@/lib/format'
import type { RoundVerification } from '@/types'
import { en } from '@/copy/en'

/**
 * "Verify round": fetches the proof (GET /api/rounds/{id}/verify) and recomputes it here,
 * in the browser. The verdict compares OUR crash point with the server's; it never takes
 * the server's word for it.
 */
const props = defineProps<{ roundId: string; roundNumber: number }>()
const emit = defineEmits<{ close: [] }>()
const t = en.verifyRound

const proof = ref<RoundVerification | null>(null)
const result = ref<VerifyResult | null>(null)
const error = ref<string | null>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = null
  try {
    proof.value = await historyService.getRoundVerification(props.roundId)
    if (proof.value.serverSeed) {
      result.value = await verifyRound({
        roundId: props.roundId,
        serverSeed: proof.value.serverSeed,
        serverSeedHash: proof.value.serverSeedHash,
        houseEdge: proof.value.houseEdge,
        maxMultiplier: proof.value.maxMultiplier,
        formulaVersion: proof.value.formulaVersion,
        crashMultiplier: proof.value.crashMultiplier,
        maxMultiplierReached: proof.value.maxMultiplierReached,
        hmacMessage: proof.value.hmacMessage,
      })
    }
  } catch {
    error.value = t.error
  } finally {
    loading.value = false
  }
}
onMounted(load)

const rows = computed(() => {
  const p = proof.value
  if (!p) return []
  return [
    { label: t.hash, value: p.serverSeedHash, mono: true },
    { label: t.seed, value: p.serverSeed ?? '—', mono: true },
    { label: t.clientSeed, value: p.clientSeed ?? t.clientSeedNone, mono: false },
    { label: t.edge, value: `${+(p.houseEdge * 100).toFixed(4)}%`, mono: false },
    { label: t.cap, value: `${multiplier(p.maxMultiplier)}x`, mono: false },
    { label: t.version, value: String(p.formulaVersion), mono: false },
    { label: t.serverCrash, value: p.crashMultiplier === null ? '—' : `${multiplier(p.crashMultiplier)}x`, mono: false },
    ...(result.value ? [{ label: t.ourCrash, value: `${multiplier(result.value.computedCrash)}x`, mono: false }] : []),
  ]
})
</script>

<template>
  <SkyModal :title="t.title(props.roundNumber)" accent="blue" width="lg" @close="emit('close')">
    <p class="flex items-start gap-1 text-sm text-foreground/90">
      <span class="pt-0.5">{{ t.intro }}</span>
      <InfoTip :text="t.howInfo" align="right" />
    </p>

    <p v-if="loading" class="mt-4 text-sm text-muted-foreground">{{ en.common.loading }}</p>
    <p v-else-if="error" role="alert" class="mt-4 text-sm font-semibold text-danger">{{ error }}</p>
    <template v-else-if="proof">
      <div
        v-if="result"
        role="status"
        :class="[
          'mt-4 flex items-center gap-2 border-2 px-3 py-2 font-display text-sm font-black uppercase tracking-[0.16em]',
          result.match ? 'border-lime text-lime [box-shadow:var(--glow-lime)]' : 'border-danger text-danger',
        ]"
      >
        {{ result.match ? `✅ ${t.match}` : `❌ ${t.mismatch}` }}
      </div>
      <p v-else class="mt-4 text-sm text-ember">{{ t.pending }}</p>

      <dl class="mt-3 divide-y divide-violet/30 border-y border-violet/30">
        <div v-for="row in rows" :key="row.label" class="grid gap-0.5 py-1.5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-3">
          <dt class="text-xs uppercase tracking-[0.12em] text-muted-foreground">{{ row.label }}</dt>
          <dd :class="['min-w-0 break-all text-sm text-foreground', row.mono && 'font-mono text-xs']">{{ row.value }}</dd>
        </div>
      </dl>
    </template>
  </SkyModal>
</template>
