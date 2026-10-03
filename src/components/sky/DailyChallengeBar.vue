<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { X, Target } from '@lucide/vue'
import ChallengeBadgeIcon from './ChallengeBadgeIcon.vue'
import { challengeBadgeFor } from '@/lib/challengeBadges'
import type { Challenge } from '@/types'

/**
 * Today's challenges as a slim notification bar along the top of the game screen. Cycles
 * through the three (pausing on hover/focus) so it never blocks play; dismissing hides it
 * until tomorrow's rotation.
 */
const props = defineProps<{ challenges: Challenge[] }>()
const emit = defineEmits<{ close: [] }>()

const index = ref(0)
const paused = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const open = computed(() => props.challenges.filter((c) => !c.isCompleted))
const list = computed(() => (open.value.length ? open.value : props.challenges))
const current = computed(() => list.value[index.value % Math.max(1, list.value.length)])
const allDone = computed(() => props.challenges.length > 0 && open.value.length === 0)

function fmt(n: number) {
  return Number.isInteger(n) ? n.toLocaleString() : (Math.round(n * 100) / 100).toLocaleString()
}
function pct(c: Challenge) {
  return c.target <= 0 ? 0 : Math.min(100, Math.round((c.progress / c.target) * 100))
}

onMounted(() => {
  timer = setInterval(() => {
    if (!paused.value && list.value.length > 1) index.value = (index.value + 1) % list.value.length
  }, 6000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div
    v-if="current"
    class="pointer-events-auto fixed left-1/2 top-[calc(env(safe-area-inset-top)+11.5rem)] sm:top-[calc(env(safe-area-inset-top)+10rem)] z-40 w-[min(40rem,calc(100vw-1.5rem))] -translate-x-1/2"
    role="status"
    aria-live="polite"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
    @focusin="paused = true"
    @focusout="paused = false"
  >
    <div class="clip-hud flex items-center gap-3 border-2 border-lime/70 bg-void/90 px-3 py-2 text-foreground backdrop-blur [box-shadow:var(--glow-lime)]">
      <ChallengeBadgeIcon :badge-key="current.badgeKey" size="sm" />
      <div class="min-w-0 flex-1">
        <p class="flex items-center gap-1.5 font-arcade text-[0.5rem] uppercase tracking-[0.18em] text-lime">
          <Target class="h-3 w-3" aria-hidden="true" />
          {{ allDone ? 'All daily challenges done!' : `Daily challenge ${index % list.length + 1}/${list.length}` }}
        </p>
        <p class="truncate text-sm font-bold leading-snug sm:text-base">{{ current.description }}</p>
        <div class="mt-1 flex items-center gap-2">
          <div class="h-1.5 flex-1 overflow-hidden border border-violet/40 bg-void/60" aria-hidden="true">
            <div class="h-full transition-all" :class="current.isCompleted ? 'bg-lime' : 'bg-electric'" :style="{ width: `${pct(current)}%` }" />
          </div>
          <span class="shrink-0 text-xs font-semibold tabular-nums">{{ fmt(current.progress) }}/{{ fmt(current.target) }}</span>
          <span class="hidden shrink-0 text-xs font-bold text-ember sm:inline">+{{ current.rewardCredits.toLocaleString() }}</span>
          <span class="hidden shrink-0 text-xs text-foreground/80 md:inline">· {{ challengeBadgeFor(current.badgeKey)?.name }}</span>
        </div>
      </div>
      <RouterLink to="/missions" class="hidden shrink-0 font-arcade text-[0.5rem] uppercase tracking-[0.15em] text-electric hover:text-foreground sm:block">
        All missions
      </RouterLink>
      <button
        type="button"
        aria-label="Hide daily challenges until tomorrow"
        class="grid h-8 w-8 shrink-0 place-items-center border-2 border-violet/60 hover:border-lime hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        @click="emit('close')"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
