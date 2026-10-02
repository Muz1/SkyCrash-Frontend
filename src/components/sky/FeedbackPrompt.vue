<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Star, X, Gift, Gamepad2, Palette, Volume2, Gauge } from '@lucide/vue'
import ArcadeButton from './ArcadeButton.vue'
import { cn } from '@/lib/cn'
import { FEEDBACK_TAGS, type FeedbackTag, type SubmitFeedbackPayload } from '@/types/insights'

/**
 * "How's your flight?" feedback form: 1–5 stars, area tags and two free-text
 * answers. Purely presentational — useFeedbackPrompt decides when it shows and
 * handles submission/reward.
 */
const props = defineProps<{ rewardCredits: number; submitting: boolean; error: string | null }>()
const emit = defineEmits<{ submit: [payload: SubmitFeedbackPayload]; dismiss: [] }>()

const MAX_TEXT = 1000
const RATING_LABELS = ['Poor', 'Meh', 'Okay', 'Good', 'Excellent']
const TAG_ICONS: Record<FeedbackTag, typeof Gamepad2> = {
  Gameplay: Gamepad2,
  'Graphics/UI': Palette,
  Sound: Volume2,
  Performance: Gauge,
}

const rating = ref(0)
const hoverRating = ref(0)
const tags = ref<FeedbackTag[]>([])
const improveText = ref('')
const likedText = ref('')
const root = ref<HTMLElement | null>(null)

const shownRating = computed(() => hoverRating.value || rating.value)
const canSubmit = computed(() => rating.value > 0 && !props.submitting)

function toggleTag(tag: FeedbackTag) {
  tags.value = tags.value.includes(tag) ? tags.value.filter((t) => t !== tag) : [...tags.value, tag]
}

// Radio-group keyboard pattern: arrows move the selection.
function onStarKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') rating.value = Math.min(5, rating.value + 1)
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') rating.value = Math.max(1, rating.value - 1)
  else return
  e.preventDefault()
  root.value?.querySelector<HTMLElement>(`[data-star="${rating.value}"]`)?.focus()
}

function submit() {
  if (!canSubmit.value) return
  emit('submit', {
    rating: rating.value,
    tags: tags.value,
    improveText: improveText.value.trim() || undefined,
    likedText: likedText.value.trim() || undefined,
  })
}

// Keep Tab inside the dialog; Escape is "Not now".
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('dismiss')
    return
  }
  if (e.key !== 'Tab' || !root.value) return
  const focusable = [...root.value.querySelectorAll<HTMLElement>('button:not([disabled]), textarea, [tabindex="0"]')]
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!first || !last) return
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

onMounted(async () => {
  document.addEventListener('keydown', onKeyDown)
  await nextTick()
  root.value?.querySelector<HTMLElement>('[data-star="1"]')?.focus()
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="fixed inset-0 z-[80] grid place-items-center bg-[oklch(0.08_0.04_285/0.82)] p-4 backdrop-blur-sm">
    <div
      ref="root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      aria-describedby="feedback-sub"
      class="clip-hud relative max-h-[calc(100dvh-2rem)] w-[min(34rem,100%)] overflow-y-auto border-2 border-electric bg-void p-5 text-foreground [box-shadow:var(--glow-blue),inset_0_0_32px_color-mix(in_oklab,var(--neon-blue)_14%,transparent)] sm:p-6"
    >
      <button
        type="button"
        aria-label="Not now"
        class="absolute right-3 top-3 grid h-9 w-9 place-items-center border-2 border-violet/60 text-foreground transition-colors hover:border-electric hover:text-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
        @click="emit('dismiss')"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>

      <h2 id="feedback-title" class="pr-10 font-display text-lg font-black uppercase tracking-[0.18em] text-electric sm:text-xl">
        How's your flight?
      </h2>
      <p id="feedback-sub" class="mt-2 text-base leading-relaxed text-foreground/90">
        Tell us what's working and what isn't. It takes under a minute.
      </p>
      <p
        v-if="rewardCredits > 0"
        class="mt-3 inline-flex items-center gap-2 border-2 border-lime/70 bg-lime/10 px-3 py-1.5 text-sm font-bold text-lime"
      >
        <Gift class="h-4 w-4" aria-hidden="true" />
        Earn {{ rewardCredits }} free credits for sending it
      </p>

      <form class="mt-5 space-y-5" @submit.prevent="submit">
        <fieldset>
          <legend class="font-arcade text-[10px] uppercase leading-relaxed tracking-wider text-foreground">
            Overall experience <span class="text-ember" aria-hidden="true">*</span>
          </legend>
          <div
            role="radiogroup"
            aria-label="Overall experience, 1 to 5 stars"
            aria-required="true"
            class="mt-2 flex items-center gap-1.5"
            @mouseleave="hoverRating = 0"
            @keydown="onStarKey"
          >
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              role="radio"
              :data-star="n"
              :aria-checked="rating === n"
              :aria-label="`${n} star${n === 1 ? '' : 's'}: ${RATING_LABELS[n - 1]}`"
              :tabindex="rating === n || (rating === 0 && n === 1) ? 0 : -1"
              class="grid h-11 w-11 place-items-center transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
              @mouseenter="hoverRating = n"
              @click="rating = n"
            >
              <Star
                :class="
                  cn(
                    'h-8 w-8 transition-colors',
                    n <= shownRating ? 'fill-[var(--neon-orange)] text-[var(--neon-orange)]' : 'text-foreground/45',
                  )
                "
                aria-hidden="true"
              />
            </button>
            <span class="ml-2 min-w-[5.5rem] text-base font-bold text-foreground" aria-live="polite">
              {{ shownRating ? RATING_LABELS[shownRating - 1] : 'Tap a star' }}
            </span>
          </div>
        </fieldset>

        <fieldset>
          <legend class="font-arcade text-[10px] uppercase leading-relaxed tracking-wider text-foreground">
            Which areas is this about?
          </legend>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <button
              v-for="tag in FEEDBACK_TAGS"
              :key="tag"
              type="button"
              :aria-pressed="tags.includes(tag)"
              :class="
                cn(
                  'flex min-h-11 items-center gap-2 border-2 px-3 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric',
                  tags.includes(tag)
                    ? 'border-electric bg-electric/20 text-foreground'
                    : 'border-violet/50 text-foreground/85 hover:border-electric',
                )
              "
              @click="toggleTag(tag)"
            >
              <component :is="TAG_ICONS[tag]" class="h-4 w-4 shrink-0" aria-hidden="true" />
              {{ tag }}
            </button>
          </div>
        </fieldset>

        <label class="block">
          <span class="font-arcade text-[10px] uppercase leading-relaxed tracking-wider text-foreground">
            What should we improve?
          </span>
          <textarea
            v-model="improveText"
            :maxlength="MAX_TEXT"
            rows="3"
            placeholder="e.g. the plane stutters at high multipliers"
            class="mt-2 w-full resize-y border-2 border-violet/50 bg-[oklch(0.15_0.05_285)] px-3 py-2 text-base leading-relaxed text-foreground placeholder:text-foreground/50 focus:border-electric focus:outline-none"
          />
          <span class="mt-1 block text-right text-xs text-foreground/70">{{ improveText.length }}/{{ MAX_TEXT }}</span>
        </label>

        <label class="block">
          <span class="font-arcade text-[10px] uppercase leading-relaxed tracking-wider text-foreground">
            What did you like most?
          </span>
          <textarea
            v-model="likedText"
            :maxlength="MAX_TEXT"
            rows="3"
            placeholder="e.g. the cash-out sound and the hangar skins"
            class="mt-2 w-full resize-y border-2 border-violet/50 bg-[oklch(0.15_0.05_285)] px-3 py-2 text-base leading-relaxed text-foreground placeholder:text-foreground/50 focus:border-electric focus:outline-none"
          />
          <span class="mt-1 block text-right text-xs text-foreground/70">{{ likedText.length }}/{{ MAX_TEXT }}</span>
        </label>

        <p v-if="error" role="alert" class="border-2 border-danger bg-danger/15 px-3 py-2 text-sm font-semibold text-foreground">
          {{ error }}
        </p>

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <ArcadeButton variant="ghost" @click="emit('dismiss')">Not now</ArcadeButton>
          <ArcadeButton type="submit" variant="primary" :disabled="!canSubmit">
            {{ submitting ? 'Sending…' : rewardCredits > 0 ? `Send & claim ${rewardCredits}` : 'Send feedback' }}
          </ArcadeButton>
        </div>
      </form>
    </div>
  </div>
</template>
