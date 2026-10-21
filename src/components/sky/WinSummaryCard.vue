<script setup lang="ts">
import { computed } from 'vue'
import { X } from '@lucide/vue'
import type { WinSummary } from '@/stores/gameStore'
import { creditAmount, multiplier, signedCredits } from '@/lib/format'
import { en } from '@/copy/en'

/**
 * After one of my cash-outs: stake, multiplier, payout and profit at a glance, plus a
 * one-line recap of the round. Two short rows so it fits a 320px stage, dismissable, and
 * it sits inside the flight stage so it never covers the bet button.
 */
const props = defineProps<{ win: WinSummary }>()
const emit = defineEmits<{ dismiss: [] }>()
const t = en.winCard

const profit = computed(() => props.win.payout - props.win.stake)
const recap = computed(() => {
  const n = props.win.roundNumber ?? 0
  if (props.win.crashMultiplier === null) return t.recapLive(n)
  const m = multiplier(props.win.crashMultiplier)
  return props.win.maxReached ? t.recapMax(n, m) : t.recapCrashed(n, m)
})
const stats = computed(() => [
  { label: t.stake, value: creditAmount(props.win.stake), cls: 'text-foreground' },
  { label: t.multiplier, value: `${multiplier(props.win.multiplier)}x`, cls: 'text-electric' },
  { label: t.payout, value: creditAmount(props.win.payout), cls: 'text-foreground' },
  { label: t.profit, value: signedCredits(profit.value), cls: 'text-lime text-glow-lime' },
])
</script>

<template>
  <section
    :aria-label="t.title"
    class="clip-hud pointer-events-auto w-[min(22rem,calc(100vw-1.5rem))] border-2 border-lime/80 bg-void/90 px-2.5 py-1.5 text-left [box-shadow:var(--glow-lime)]"
  >
    <div class="flex items-center gap-2">
      <p class="shrink-0 font-display text-[0.625rem] font-black uppercase tracking-[0.2em] text-lime">{{ t.title }}</p>
      <p class="min-w-0 flex-1 truncate text-[0.6875rem] text-muted-foreground" aria-live="polite">{{ recap }}</p>
      <button
        type="button"
        :aria-label="t.dismiss"
        class="-my-1 -mr-1.5 grid h-7 w-7 shrink-0 place-items-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime pointer-coarse:h-11 pointer-coarse:w-11"
        @click="emit('dismiss')"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
    <dl class="grid grid-cols-4 gap-x-2">
      <div v-for="s in stats" :key="s.label" class="min-w-0">
        <dt class="truncate text-[0.625rem] uppercase tracking-[0.08em] text-muted-foreground">{{ s.label }}</dt>
        <dd :class="['truncate font-arcade text-[0.5rem] tabular-nums sm:text-[0.5625rem]', s.cls]">{{ s.value }}</dd>
      </div>
    </dl>
  </section>
</template>
