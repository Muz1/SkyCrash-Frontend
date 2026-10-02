<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plane, Users, X, Clock } from '@lucide/vue'
import ArcadeButton from './ArcadeButton.vue'
import ChallengeBadgeIcon from './ChallengeBadgeIcon.vue'
import { challengeBadgeFor, SOCIAL_CHALLENGE_TYPES } from '@/lib/challengeBadges'
import { useCountdown, formatDuration } from '@/composables/useCountdown'
import type { Challenge } from '@/types'

/**
 * "Today's Challenges" briefing shown before the first flight of the day: the three
 * rotating challenges, the badge each one awards, and when the rotation moves on.
 * "Let's fly" closes it and the player starts betting.
 */
const props = defineProps<{ challenges: Challenge[] }>()
const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const root = ref<HTMLElement | null>(null)

const resetsAt = computed(() => props.challenges[0]?.resetsAtUtc ?? null)
const { seconds } = useCountdown(resetsAt)
const hasSocial = computed(() => props.challenges.some((c) => !c.isCompleted && SOCIAL_CHALLENGE_TYPES.has(c.type)))

function pct(c: Challenge) {
  return c.target <= 0 ? 0 : Math.min(100, Math.round((c.progress / c.target) * 100))
}
function fmt(n: number) {
  return Number.isInteger(n) ? n.toLocaleString() : (Math.round(n * 100) / 100).toLocaleString()
}

function openLobby() {
  emit('close')
  router.push('/lobby')
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(async () => {
  document.addEventListener('keydown', onKeyDown)
  await nextTick()
  root.value?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="fixed inset-0 z-[80] grid place-items-center bg-[oklch(0.08_0.04_285/0.82)] p-4 backdrop-blur-sm">
    <div
      ref="root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-title"
      class="clip-hud relative max-h-[calc(100dvh-2rem)] w-[min(36rem,100%)] overflow-y-auto border-2 border-lime bg-void p-5 text-foreground [box-shadow:var(--glow-lime),inset_0_0_32px_color-mix(in_oklab,var(--neon-lime)_12%,transparent)] sm:p-6"
    >
      <button
        type="button"
        aria-label="Close"
        class="absolute right-3 top-3 grid h-9 w-9 place-items-center border-2 border-violet/60 text-foreground transition-colors hover:border-lime hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        @click="emit('close')"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>

      <h2 id="daily-title" class="pr-10 font-display text-lg font-black uppercase tracking-[0.18em] text-lime sm:text-xl">
        Today's Challenges
      </h2>
      <p class="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground/90">
        <Clock class="h-4 w-4 shrink-0" aria-hidden="true" />
        New rotation in <span class="font-display tabular-nums text-foreground" aria-live="off">{{ formatDuration(seconds) }}</span>
      </p>

      <ul class="mt-5 space-y-3">
        <li
          v-for="c in challenges"
          :key="c.id"
          class="flex items-center gap-4 border-2 p-3"
          :class="c.isCompleted ? 'border-lime/60 bg-lime/10' : 'border-violet/50 bg-[oklch(0.15_0.05_285)]'"
        >
          <ChallengeBadgeIcon :badge-key="c.badgeKey" size="lg" :locked="!c.isCompleted" />
          <div class="min-w-0 flex-1">
            <p class="font-arcade text-[9px] uppercase tracking-wider text-foreground/75">{{ c.track }}</p>
            <p class="mt-1 text-base font-bold leading-snug text-foreground">{{ c.description }}</p>
            <div
              class="mt-2 h-2 w-full overflow-hidden border border-violet/40 bg-void/60"
              role="progressbar"
              :aria-valuenow="pct(c)"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`${c.description} progress`"
            >
              <div class="h-full transition-all" :class="c.isCompleted ? 'bg-lime' : 'bg-electric'" :style="{ width: `${pct(c)}%` }" />
            </div>
            <p class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/85">
              <span class="tabular-nums">{{ fmt(c.progress) }}/{{ fmt(c.target) }}</span>
              <span class="font-bold text-ember">+{{ c.rewardCredits.toLocaleString() }} credits</span>
              <span>· {{ challengeBadgeFor(c.badgeKey)?.name }} badge</span>
              <span v-if="c.isCompleted" class="font-bold text-lime">Done!</span>
            </p>
          </div>
        </li>
      </ul>

      <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ArcadeButton v-if="hasSocial" variant="blue" @click="openLobby">
          <Users class="h-4 w-4" aria-hidden="true" /> Open lobby
        </ArcadeButton>
        <ArcadeButton variant="primary" data-autofocus @click="emit('close')">
          <Plane class="h-4 w-4" aria-hidden="true" /> Let's fly
        </ArcadeButton>
      </div>
    </div>
  </div>
</template>
