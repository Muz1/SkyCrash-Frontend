<script setup lang="ts">
import { ref } from 'vue'
import { X } from '@lucide/vue'
import { cn } from '@/lib/cn'
import TutorialIllustration from './TutorialIllustration.vue'
import { TUTORIAL_STEPS } from '@/lib/tutorialSteps'
import { polishCopy } from '@/copy/polish'

/**
 * "How it works" for first-time pilots. The full version (landing page) is the illustrated
 * tutorial as a strip of five small cards: credits → bet → climb → cash out → crash, plus the
 * house-edge footnote. It swipes sideways on narrow phones. The compact one is a single
 * dismissible line (game screen) that stays hidden once closed.
 */
const props = withDefaults(defineProps<{ compact?: boolean; class?: string }>(), { compact: false })

const STORAGE_KEY = 'skycrash_howto_dismissed'

const copy = polishCopy

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
    <span class="shrink-0 font-arcade text-[0.5rem] uppercase tracking-[0.2em] text-ember">How to play</span>
    <span class="min-w-0 flex-1 leading-snug">
      <span class="font-bold">Bet</span> <span aria-hidden="true" class="text-ember">→</span>
      watch the multiplier climb <span aria-hidden="true" class="text-ember">→</span>
      <span class="font-bold">cash out</span> before the plane crashes
    </span>
    <button
      type="button"
      aria-label="Hide how to play"
      class="grid h-7 w-7 shrink-0 place-items-center pointer-coarse:-my-2 pointer-coarse:h-11 pointer-coarse:w-11 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember"
      @click="dismiss"
    >
      <X class="h-4 w-4" aria-hidden="true" />
    </button>
  </div>

  <section v-else-if="!compact" aria-labelledby="how-to-play-title" :class="cn('w-full max-w-4xl', props.class)">
    <h2
      id="how-to-play-title"
      class="mb-2 text-center font-arcade text-[0.5625rem] uppercase tracking-[0.3em] text-ember text-glow-ember"
    >
      {{ copy.landing.howItWorks }}
    </h2>
    <!-- Narrow phones: a sideways swipe strip; from sm up all five fit in a row. -->
    <ol
      data-scroll-x
      class="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0"
    >
      <li
        v-for="(s, i) in TUTORIAL_STEPS"
        :key="s.key"
        class="clip-hud flex w-[8.5rem] shrink-0 snap-start flex-col border-2 border-magenta/50 bg-void/80 text-left sm:w-auto"
      >
        <div class="relative h-20 border-b border-violet/40 bg-deep/70 [@media(max-height:640px)]:h-14">
          <TutorialIllustration :step="s.key" mini />
        </div>
        <div class="p-2">
          <p class="flex items-baseline gap-1.5">
            <span class="font-arcade text-[0.625rem] text-magenta text-glow-magenta">{{ i + 1 }}</span>
            <span class="font-display text-[0.6875rem] font-black uppercase leading-tight tracking-[0.08em] text-foreground">{{ s.title }}</span>
          </p>
          <p class="mt-1 text-sm leading-snug text-[#d8ccf5] [@media(max-height:640px)]:hidden">{{ s.body }}</p>
        </div>
      </li>
    </ol>
    <p class="mt-2 text-center text-sm text-[#d8ccf5]">{{ copy.tutorial.house }}</p>
  </section>
</template>
