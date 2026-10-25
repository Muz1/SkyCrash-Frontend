<script setup lang="ts">
import { computed, ref } from 'vue'
import { Radio, ChevronUp, ChevronDown } from '@lucide/vue'
import { useGameStore, type LiveBetRow } from '@/stores/gameStore'
import { creditAmount, multiplier } from '@/lib/format'
import { en } from '@/copy/en'

/**
 * Who's in this round and who cashed out at what (usernames only, from GetLiveRoundBets
 * plus the LiveBet / LiveCashOut events). Large screens: a panel on the right of the stage
 * that can be folded away. Phones and tablets: a chip in the round strip that opens it.
 */
const props = withDefaults(defineProps<{ mode?: 'panel' | 'chip' }>(), { mode: 'panel' })
const gameStore = useGameStore()
const t = en.live

const open = ref(props.mode === 'panel')
const rows = computed(() => gameStore.liveBets)
const outCount = computed(() => rows.value.filter((r) => r.status === 'CashedOut').length)

function statusText(row: LiveBetRow) {
  if (row.status === 'CashedOut') return `${multiplier(row.cashOutMultiplier ?? 0)}x`
  if (row.status === 'Lost') return t.lost
  return t.in
}
function statusClass(row: LiveBetRow) {
  if (row.status === 'CashedOut') return 'text-lime'
  if (row.status === 'Lost') return 'text-danger'
  return 'text-electric'
}
</script>

<template>
  <div
    :class="
      props.mode === 'panel'
        ? 'pointer-events-auto absolute right-0 top-24 z-10 hidden max-h-[calc(100%-7rem)] w-[calc(14rem*var(--text-scale,1))] max-w-[34vw] flex-col lg:flex'
        : 'shrink-0 lg:hidden'
    "
  >
    <button
      type="button"
      :aria-expanded="open"
      :aria-label="open ? t.hide : t.show"
      :class="[
        'clip-hud flex items-center gap-1.5 border-2 border-electric/60 bg-void/80 font-arcade text-[0.5rem] uppercase text-electric pointer-coarse:h-11',
        props.mode === 'panel' ? 'h-8 w-full justify-between px-2' : 'h-8 px-2',
      ]"
      @click="open = !open"
    >
      <span class="flex items-center gap-1.5">
        <Radio class="h-3 w-3" aria-hidden="true" />
        {{ props.mode === 'panel' ? t.title : t.toggle(rows.length) }}
      </span>
      <template v-if="props.mode === 'panel'">
        <span class="text-muted-foreground">{{ rows.length }}</span>
        <ChevronUp v-if="open" class="h-3 w-3" aria-hidden="true" />
        <ChevronDown v-else class="h-3 w-3" aria-hidden="true" />
      </template>
    </button>

    <Teleport to="body" :disabled="props.mode === 'panel'">
      <div v-if="props.mode === 'chip' && open" class="fixed inset-0 z-[60] bg-void/50" aria-hidden="true" @click="open = false" />
      <section
        v-if="open"
        :aria-label="t.title"
        :class="[
          'neon-panel clip-hud min-h-0 overflow-y-auto overflow-x-hidden p-2',
          props.mode === 'panel' ? 'mt-1' : 'fixed inset-x-3 top-[calc(env(safe-area-inset-top)+7rem)] z-[61] max-h-[60dvh]',
        ]"
      >
        <p class="flex items-baseline justify-between gap-2 font-display text-[0.5625rem] font-black uppercase tracking-[0.3em] text-electric">
          <span :class="props.mode === 'panel' && 'sr-only'">{{ t.title }}</span>
          <span class="font-arcade text-[0.4375rem] tracking-normal text-muted-foreground">{{ outCount }}/{{ rows.length }} {{ t.out }}</span>
        </p>
        <p v-if="rows.length === 0" class="mt-1 text-xs text-muted-foreground">{{ t.empty }}</p>
        <ul v-else class="mt-1 divide-y divide-violet/25">
          <li v-for="row in rows" :key="row.username" class="flex items-center gap-2 py-1 text-xs">
            <span class="min-w-0 flex-1 truncate font-semibold text-foreground">{{ row.username }}</span>
            <span class="shrink-0 tabular-nums text-muted-foreground">{{ creditAmount(row.amount) }}</span>
            <span :class="['w-[calc(3rem*var(--text-scale,1))] shrink-0 text-right font-arcade text-[0.5rem] tabular-nums', statusClass(row)]">{{ statusText(row) }}</span>
          </li>
        </ul>
      </section>
    </Teleport>
  </div>
</template>
