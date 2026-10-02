<script setup lang="ts">
import { ref } from 'vue'
import { X } from '@lucide/vue'
import { cn } from '@/lib/cn'
import NeonPanel from './NeonPanel.vue'

/**
 * "How to play" for first-time pilots: bet → watch the multiplier climb →
 * cash out before the plane crashes. The full version is three panels (home
 * page); the compact one is a single dismissible line (game screen) that stays
 * hidden once closed.
 */
const props = withDefaults(defineProps<{ compact?: boolean; class?: string }>(), { compact: false })

const STORAGE_KEY = 'skycrash_howto_dismissed'

const steps = [
  { n: '1', t: 'Bet', d: 'Place your bet before the plane takes off.' },
  { n: '2', t: 'Watch it climb', d: 'The multiplier rises the higher the plane flies.' },
  { n: '3', t: 'Cash out', d: 'Bank your winnings before the plane crashes.' },
]

function readDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

const dismissed = ref(props.compact && readDismissed())

function dismiss() {
  dismissed.value = true
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Non-fatal: it just shows again next visit.
  }
}
</script>

<template>
  <div
    v-if="compact && !dismissed"
    role="note"
    aria-label="How to play"
    :class="
      cn(
        'clip-hud flex items-center gap-2 border border-ember/70 bg-void/80 py-1.5 pl-3 pr-1 text-sm text-foreground',
        props.class,
      )
    "
  >
    <span class="shrink-0 font-arcade text-[8px] uppercase tracking-[0.2em] text-ember">How to play</span>
    <span class="min-w-0 flex-1 leading-snug">
      <span class="font-bold">Bet</span> <span aria-hidden="true" class="text-ember">→</span>
      watch the multiplier climb <span aria-hidden="true" class="text-ember">→</span>
      <span class="font-bold">cash out</span> before the plane crashes
    </span>
    <button
      type="button"
      aria-label="Hide how to play"
      class="grid h-7 w-7 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember"
      @click="dismiss"
    >
      <X class="h-4 w-4" aria-hidden="true" />
    </button>
  </div>

  <section v-else-if="!compact" aria-labelledby="how-to-play-title" :class="cn('w-full max-w-3xl', props.class)">
    <h2
      id="how-to-play-title"
      class="mb-2 text-center font-arcade text-[9px] uppercase tracking-[0.3em] text-ember text-glow-ember"
    >
      How to play
    </h2>
    <ol class="grid grid-cols-3 gap-2 sm:gap-3">
      <li v-for="s in steps" :key="s.n">
        <NeonPanel accent="magenta" class="h-full [&>div]:p-2.5 sm:[&>div]:p-4">
          <p class="flex items-baseline gap-2">
            <span class="font-arcade text-sm text-magenta text-glow-magenta sm:text-xl">{{ s.n }}</span>
            <span class="font-display text-[11px] font-black uppercase tracking-[0.1em] text-foreground sm:text-sm sm:tracking-[0.16em]">
              {{ s.t }}
            </span>
          </p>
          <p class="mt-1 hidden text-sm leading-snug text-muted-foreground xs:block [@media(max-height:640px)]:hidden">
            {{ s.d }}
          </p>
        </NeonPanel>
      </li>
    </ol>
  </section>
</template>
