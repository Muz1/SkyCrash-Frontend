<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Star, X, Gift, Check, Coins } from '@lucide/vue'
import ArcadeButton from './ArcadeButton.vue'
import { cn } from '@/lib/cn'
import { FEATURE_REQUESTS, type FeatureRequestTag } from '@/types/feedback'
import type { useFeedbackForm } from '@/composables/useFeedbackPrompt'

/**
 * The feedback dialog, in three stages:
 *   ask  — a small yes/no box ("Would you like to give us some feedback?")
 *   form — 1–5 stars (required), two free-text answers, feature wishes, a comment
 *   done — thank-you screen, with the credits earned when there were any
 * Credits are only promised while the server says a reward is available.
 * useFeedbackForm / useFeedbackPrompt decide when it opens and handle submission.
 */
const props = withDefaults(
  defineProps<{
    controller: ReturnType<typeof useFeedbackForm>
    /** Button on the thank-you screen. */
    doneLabel?: string
  }>(),
  { doneLabel: 'Back to the game' },
)

const MAX_TEXT = 1000
const RATING_LABELS = ['Poor', 'Meh', 'Okay', 'Good', 'Excellent']

const fb = props.controller
const stage = computed(() => fb.stage.value)
const rewardAvailable = computed(() => fb.rewardAvailable.value)
const rewardCredits = computed(() => fb.rewardCredits.value)
const submitting = computed(() => fb.submitting.value)
const creditsAwarded = computed(() => fb.result.value?.creditsAwarded ?? 0)

const rating = ref(0)
const hoverRating = ref(0)
const likedText = ref('')
const improveText = ref('')
const wishes = ref<FeatureRequestTag[]>([])
const additionalComment = ref('')
const showRatingHint = ref(false)
const root = ref<HTMLElement | null>(null)

const shownRating = computed(() => hoverRating.value || rating.value)

// Radio-group keyboard pattern: arrows move the selection.
function onStarKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') rating.value = Math.min(5, rating.value + 1)
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') rating.value = Math.max(1, rating.value - 1)
  else return
  e.preventDefault()
  root.value?.querySelector<HTMLElement>(`[data-star="${rating.value}"]`)?.focus()
}

function submit() {
  if (submitting.value) return
  if (rating.value === 0) {
    // The rating is the one required answer: point at it rather than silently refusing.
    showRatingHint.value = true
    root.value?.querySelector<HTMLElement>('[data-star="1"]')?.focus()
    return
  }
  void fb.submit({
    rating: rating.value,
    likedText: likedText.value.trim() || undefined,
    improveText: improveText.value.trim() || undefined,
    tags: wishes.value,
    additionalComment: additionalComment.value.trim() || undefined,
  })
}

watch(rating, (r) => {
  if (r > 0) showRatingHint.value = false
})

// Keep Tab inside the dialog; Escape is "maybe later" (or just closes the thank-you screen).
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (stage.value === 'done') fb.close()
    else fb.dismiss()
    return
  }
  if (e.key !== 'Tab' || !root.value) return
  const focusable = [
    ...root.value.querySelectorAll<HTMLElement>('button:not([disabled]), textarea, input:not([disabled]), [tabindex="0"]'),
  ]
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

/** Puts focus on the natural first control of each stage. */
async function focusStage() {
  await nextTick()
  const selector = stage.value === 'form' ? '[data-star="1"]' : '[data-autofocus]'
  root.value?.querySelector<HTMLElement>(selector)?.focus()
  root.value?.scrollTo?.({ top: 0 })
}

watch(stage, focusStage)
onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  void focusStage()
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown))

const fieldClass =
  'mt-2 w-full resize-y border-2 border-violet/50 bg-[oklch(0.15_0.05_285)] px-3 py-2 text-base leading-relaxed text-foreground placeholder:text-foreground/50 focus:border-electric focus:outline-none'
const questionClass = 'block text-base font-bold leading-snug text-foreground'
</script>

<template>
  <div
    :class="
      cn(
        'fixed inset-0 z-[80] grid p-4',
        stage === 'ask'
          ? 'place-items-end bg-[oklch(0.08_0.04_285/0.45)] sm:place-items-center'
          : 'place-items-center bg-[oklch(0.08_0.04_285/0.82)] backdrop-blur-sm',
      )
    "
  >
    <!-- 1. The yes/no box -->
    <div
      v-if="stage === 'ask'"
      ref="root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-ask-title"
      aria-describedby="feedback-ask-sub"
      class="clip-hud animate-sky-pop w-[min(26rem,100%)] border-2 border-electric bg-void p-5 text-center text-foreground [box-shadow:var(--glow-blue),inset_0_0_28px_color-mix(in_oklab,var(--neon-blue)_14%,transparent)]"
    >
      <h2 id="feedback-ask-title" class="font-display text-base font-black uppercase leading-snug tracking-[0.12em] text-foreground sm:text-lg">
        Would you like to give us some feedback?
      </h2>
      <p
        v-if="rewardAvailable"
        id="feedback-ask-sub"
        class="mt-3 inline-flex items-center gap-2 border-2 border-lime/70 bg-lime/10 px-3 py-1.5 text-base font-bold text-lime"
      >
        <Gift class="h-4 w-4" aria-hidden="true" />
        It's worth {{ rewardCredits.toLocaleString() }} credits
      </p>
      <p v-else id="feedback-ask-sub" class="mt-3 text-base text-foreground/90">Help us improve Sky Crash.</p>
      <div class="mt-5 grid grid-cols-2 gap-3">
        <ArcadeButton variant="ghost" size="md" @click="fb.dismiss()">No</ArcadeButton>
        <ArcadeButton variant="primary" size="md" data-autofocus @click="fb.accept()">Yes</ArcadeButton>
      </div>
    </div>

    <div
      v-else
      ref="root"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="stage === 'form' ? 'feedback-title' : 'feedback-done-title'"
      class="clip-hud relative max-h-[calc(100dvh-2rem)] w-[min(36rem,100%)] overflow-y-auto border-2 border-electric bg-void p-5 text-foreground [box-shadow:var(--glow-blue),inset_0_0_32px_color-mix(in_oklab,var(--neon-blue)_14%,transparent)] sm:p-6"
    >
      <!-- 2. The form -->
      <template v-if="stage === 'form'">
        <button
          type="button"
          aria-label="Maybe later"
          class="absolute right-3 top-3 grid h-9 w-9 place-items-center border-2 border-violet/60 text-foreground transition-colors hover:border-electric hover:text-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
          @click="fb.dismiss()"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>

        <h2 id="feedback-title" class="pr-10 font-display text-lg font-black uppercase tracking-[0.14em] text-electric sm:text-xl">
          Your Feedback
        </h2>
        <p
          v-if="rewardAvailable"
          class="mt-3 inline-flex items-center gap-2 border-2 border-lime/70 bg-lime/10 px-3 py-1.5 text-sm font-bold text-lime"
        >
          <Gift class="h-4 w-4" aria-hidden="true" />
          Earn {{ rewardCredits.toLocaleString() }} credits for sending it
        </p>
        <p v-else class="mt-2 text-base text-foreground/90">Help us improve Sky Crash.</p>

        <form class="mt-5 space-y-6" novalidate @submit.prevent="submit">
          <fieldset>
            <legend :class="questionClass">
              How are you enjoying Sky Crash? <span class="text-ember" aria-hidden="true">*</span>
            </legend>
            <div
              role="radiogroup"
              aria-label="How are you enjoying Sky Crash? 1 to 5 stars"
              aria-required="true"
              :aria-invalid="showRatingHint"
              :aria-describedby="showRatingHint ? 'feedback-rating-hint' : undefined"
              class="mt-2 flex flex-wrap items-center gap-1.5"
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
            <p v-if="showRatingHint" id="feedback-rating-hint" role="alert" class="mt-1 text-sm font-semibold text-ember">
              Pick a star rating to send your feedback.
            </p>
          </fieldset>

          <label class="block">
            <span :class="questionClass">What do you like about the game?</span>
            <textarea
              v-model="likedText"
              :maxlength="MAX_TEXT"
              rows="2"
              placeholder="e.g. the cash-out sound and the hangar skins"
              :class="fieldClass"
            />
          </label>

          <label class="block">
            <span :class="questionClass">What could we improve?</span>
            <textarea
              v-model="improveText"
              :maxlength="MAX_TEXT"
              rows="2"
              placeholder="e.g. make the bet buttons bigger on my phone"
              :class="fieldClass"
            />
          </label>

          <fieldset>
            <legend :class="questionClass">What would you like us to add?</legend>
            <div class="mt-2 grid grid-cols-1 gap-2 xs:grid-cols-2">
              <label
                v-for="option in FEATURE_REQUESTS"
                :key="option.tag"
                :class="
                  cn(
                    'flex min-h-11 cursor-pointer items-center gap-3 border-2 px-3 text-sm font-bold transition-colors focus-within:ring-2 focus-within:ring-electric',
                    wishes.includes(option.tag)
                      ? 'border-electric bg-electric/20 text-foreground'
                      : 'border-violet/50 text-foreground/90 hover:border-electric',
                  )
                "
              >
                <input
                  v-model="wishes"
                  type="checkbox"
                  :value="option.tag"
                  class="h-4 w-4 shrink-0 cursor-pointer accent-[var(--neon-blue)] focus-visible:outline-none"
                />
                {{ option.label }}
              </label>
            </div>
          </fieldset>

          <label class="block">
            <span :class="questionClass">Anything else? <span class="font-normal text-foreground/70">(optional)</span></span>
            <textarea v-model="additionalComment" :maxlength="MAX_TEXT" rows="2" :class="fieldClass" />
          </label>

          <p v-if="fb.error.value" role="alert" class="border-2 border-danger bg-danger/15 px-3 py-2 text-sm font-semibold text-foreground">
            {{ fb.error.value }}
          </p>

          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <ArcadeButton variant="ghost" @click="fb.dismiss()">Maybe later</ArcadeButton>
            <ArcadeButton type="submit" variant="primary" :disabled="submitting">
              {{ submitting ? 'Sending…' : 'Submit Feedback' }}
            </ArcadeButton>
          </div>
        </form>
      </template>

      <!-- 3. Thank-you / reward -->
      <div v-else class="py-2 text-center" role="status">
        <template v-if="creditsAwarded > 0">
          <div class="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-lime bg-lime/15 text-lime [box-shadow:var(--glow-lime)]">
            <Coins class="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 id="feedback-done-title" class="animate-sky-pop mt-4 font-arcade text-2xl text-lime text-glow-lime sm:text-3xl">
            +{{ creditsAwarded.toLocaleString() }} Credits
          </h2>
          <p class="mt-3 text-base text-foreground">Thanks for your feedback, pilot! The credits are in your balance.</p>
          <p v-if="fb.result.value" class="mt-1 text-sm text-foreground/80">
            New balance: <span class="font-bold text-foreground">{{ fb.result.value.newBalance.toLocaleString() }}</span>
          </p>
        </template>
        <template v-else>
          <div class="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-electric bg-electric/15 text-electric [box-shadow:var(--glow-blue)]">
            <Check class="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 id="feedback-done-title" class="animate-sky-pop mt-4 font-display text-xl font-black uppercase tracking-[0.14em] text-electric">
            Thanks for your feedback
          </h2>
          <p class="mt-3 text-base text-foreground">It helps us make Sky Crash better.</p>
        </template>
        <ArcadeButton variant="primary" size="lg" class="mt-6" data-autofocus @click="fb.close()">
          {{ doneLabel }}
        </ArcadeButton>
      </div>
    </div>
  </div>
</template>
