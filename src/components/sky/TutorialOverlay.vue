<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronLeft, ChevronRight, X } from '@lucide/vue'
import ArcadeButton from './ArcadeButton.vue'
import TutorialIllustration from './TutorialIllustration.vue'
import { TUTORIAL_STEPS } from '@/lib/tutorialSteps'
import { polishCopy } from '@/copy/polish'

/**
 * Pre-flight briefing for first-time pilots: five short illustrated steps (credits → bet →
 * multiplier climbing → cash out → crash), each one picture and one line. Skippable at any
 * point; replay it from the "?" button, the landing page or /game?tutorial=1.
 */
const emit = defineEmits<{ close: [] }>()
const copy = polishCopy.tutorial

const index = ref(0)
const step = computed(() => TUTORIAL_STEPS[index.value]!)
const last = computed(() => index.value === TUTORIAL_STEPS.length - 1)
const dialog = ref<HTMLElement | null>(null)

function next() {
  if (last.value) emit('close')
  else index.value++
}
function back() {
  if (index.value > 0) index.value--
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') back()
}
onMounted(async () => {
  window.addEventListener('keydown', onKey)
  await nextTick()
  dialog.value?.focus()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <!-- Centred, and scrollable as a whole if a very short screen still can't fit it. -->
  <div class="fixed inset-0 z-[90] flex overflow-y-auto bg-void/80 p-3 backdrop-blur-sm sm:p-4">
    <section
      ref="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      aria-describedby="tutorial-body"
      tabindex="-1"
      class="tut-card neon-panel clip-hud relative m-auto w-full min-w-0 max-w-md p-4 focus:outline-none sm:p-6"
    >
      <div class="flex items-center gap-2 sm:gap-3">
        <p class="min-w-0 font-arcade text-[0.5rem] uppercase leading-relaxed tracking-[0.2em] text-ember">
          {{ copy.kicker }} · {{ index + 1 }}/{{ TUTORIAL_STEPS.length }}
        </p>
        <button
          type="button"
          class="ml-auto flex shrink-0 items-center gap-1.5 border-2 border-violet/60 px-2 py-1 pointer-coarse:min-h-11 font-arcade text-[0.5rem] uppercase tracking-[0.15em] text-foreground hover:border-magenta hover:text-magenta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
          @click="emit('close')"
        >
          <X class="h-3 w-3" aria-hidden="true" /> {{ copy.skip }}
        </button>
      </div>

      <div class="tut-pic relative mt-3 h-36 border-2 border-violet/40 bg-deep/70 sm:mt-4 sm:h-40">
        <TutorialIllustration :key="step.key" :step="step.key" />
      </div>

      <h2
        id="tutorial-title"
        class="mt-3 font-display text-lg font-black uppercase tracking-[0.1em] text-foreground sm:mt-4 sm:text-2xl sm:tracking-[0.12em]"
      >
        {{ step.title }}
      </h2>
      <p id="tutorial-body" class="mt-2 text-base leading-relaxed text-foreground" aria-live="polite">
        {{ step.body }}
      </p>
      <p v-if="last" class="mt-2 text-sm leading-snug text-[#c4b5fd]">
        <span class="font-arcade text-[0.5rem] uppercase tracking-[0.15em] text-ember">Fair play · </span>{{ copy.house }}
      </p>

      <div class="mt-4 flex items-center gap-2 sm:mt-5 sm:gap-3">
        <button
          type="button"
          :aria-label="copy.back"
          class="flex shrink-0 items-center justify-center gap-1 border-2 border-violet/50 px-3 py-2 pointer-coarse:min-h-11 pointer-coarse:min-w-11 font-arcade text-[0.5625rem] uppercase text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric disabled:opacity-30"
          :disabled="index === 0"
          @click="back"
        >
          <ChevronLeft class="h-3.5 w-3.5" aria-hidden="true" /><span class="hidden min-[400px]:inline">{{ copy.back }}</span>
        </button>
        <div class="flex min-w-0 flex-1 justify-center gap-1" aria-hidden="true">
          <span
            v-for="(s, i) in TUTORIAL_STEPS"
            :key="s.key"
            :class="[
              'h-1.5 w-3 shrink transition-colors min-[400px]:w-5',
              i === index ? 'bg-ember' : i < index ? 'bg-magenta/70' : 'bg-violet/40',
            ]"
          />
        </div>
        <ArcadeButton type="button" size="md" class="shrink-0" :variant="last ? 'primary' : 'magenta'" @click="next">
          {{ last ? copy.done : copy.next }}
          <ChevronRight v-if="!last" class="h-4 w-4" aria-hidden="true" />
        </ArcadeButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Short screens (phones held sideways): a smaller picture so the whole card fits. */
@media (max-height: 520px) {
  .tut-pic {
    height: 6.5rem;
  }
  .tut-pic :deep(.tut-ill) > * {
    transform: scale(0.75);
  }
  .tut-card {
    padding: 0.875rem 1rem;
  }
  .tut-card > .tut-pic {
    margin-top: 0.5rem;
  }
  .tut-card > h2 {
    margin-top: 0.5rem;
    font-size: 1.05rem;
  }
  .tut-card > p {
    margin-top: 0.25rem;
    line-height: 1.45;
  }
  .tut-card > div:last-child {
    margin-top: 0.625rem;
  }
}
</style>
