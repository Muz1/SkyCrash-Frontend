<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { Star, X, Gift, Check, Coins, Plane, ShieldCheck } from '@lucide/vue'
import ArcadeButton from './ArcadeButton.vue'
import ChoiceCards from './ChoiceCards.vue'
import PilotProfileStep from './PilotProfileStep.vue'
import { cn } from '@/lib/cn'
import {
  FEATURE_REQUESTS,
  INSIGHT_OPTIONS,
  type FeatureRequestTag,
  type PilotStep,
  type PlayerInsightAnswers,
} from '@/types/feedback'
import { getMyInsightAnswers } from '@/services/feedbackService'
import type { useFeedbackForm } from '@/composables/useFeedbackPrompt'

/**
 * The feedback dialog, in three stages:
 *   ask  — a small yes/no box ("Would you like to give us some feedback?")
 *   form — a short "flight" of steps:
 *            1. Your feedback: 1–5 stars (required), likes, what to improve, wishes, a comment,
 *               would you recommend us
 *            2. Tell us about you: an optional intro the player can skip straight past
 *            3–9. Optional pilot-profile steps (PilotProfileStep), each with Skip
 *   done — thank-you screen, with the credits earned when there were any
 * The reward never depends on the optional steps. Credits are only promised while the server
 * says a reward is available. useFeedbackForm / useFeedbackPrompt decide when it opens.
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

type StepKey = 'feedback' | 'intro' | PilotStep
const STEPS: { key: StepKey; kicker: string; title: string }[] = [
  { key: 'feedback', kicker: 'Pre-flight check', title: 'Your feedback' },
  { key: 'intro', kicker: 'Optional', title: 'Tell us about you ✈️' },
  { key: 'pilot', kicker: 'Get to know your pilot', title: 'Pilot profile' },
  { key: 'style', kicker: 'Get to know your pilot', title: 'Your gaming style 🎮' },
  { key: 'motivation', kicker: 'Get to know your pilot', title: 'What makes you play? 🚀' },
  { key: 'features', kicker: 'Get to know your pilot', title: "What's your favourite part of Sky Crash?" },
  { key: 'discovery', kicker: 'Get to know your pilot', title: 'How did you find us? 📣' },
  { key: 'hook', kicker: 'Get to know your pilot', title: 'What would make you stop scrolling? 👀' },
  { key: 'optin', kicker: 'Last stop', title: 'Want to hear from us? ✈️' },
]
const LAST = STEPS.length - 1

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
const recommend = ref<string | null>(null)
const showRatingHint = ref(false)
const root = ref<HTMLElement | null>(null)

const stepIndex = ref(0)
const step = computed(() => STEPS[stepIndex.value]!)
const pilotStep = computed(() => step.value.key as PilotStep)
const sharedProfile = ref(false)

function emptyAnswers(): PlayerInsightAnswers {
  return {
    ageRange: null, gender: null, genderSelfDescribe: null, country: null, region: null, occupation: null,
    playFrequency: null, devices: [], sessionLength: null, gameGenres: [], motivations: [], triedBecause: null,
    favouriteFeatures: [], wantNext: [], wantNextText: null, discoverySource: null, socialPlatforms: [],
    scrollHooks: [], marketingOptIn: null, marketingContact: null,
  }
}
const answers = reactive<PlayerInsightAnswers>(emptyAnswers())

// Which answers each optional step owns (for Skip, which clears them).
const STEP_FIELDS: Record<PilotStep, (keyof PlayerInsightAnswers)[]> = {
  pilot: ['ageRange', 'gender', 'genderSelfDescribe', 'country', 'region', 'occupation'],
  style: ['playFrequency', 'devices', 'sessionLength', 'gameGenres'],
  motivation: ['motivations', 'triedBecause'],
  features: ['favouriteFeatures', 'wantNext', 'wantNextText'],
  discovery: ['discoverySource', 'socialPlatforms'],
  hook: ['scrollHooks'],
  optin: ['marketingOptIn', 'marketingContact'],
}

// Pre-fill with the player's own earlier answers (only ever their own row).
onMounted(async () => {
  try {
    const saved = await getMyInsightAnswers()
    if (saved) {
      for (const [k, v] of Object.entries(saved)) {
        const key = k as keyof PlayerInsightAnswers
        if (v === null || v === undefined) continue
        ;(answers as Record<string, unknown>)[key] = Array.isArray(v) ? [...v] : v
      }
    }
  } catch {
    // Pre-filling is a nicety; the form works without it.
  }
})

const shownRating = computed(() => hoverRating.value || rating.value)

// Radio-group keyboard pattern: arrows move the selection.
function onStarKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') rating.value = Math.min(5, rating.value + 1)
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown')
    rating.value = Math.max(1, rating.value - 1)
  else return
  e.preventDefault()
  root.value?.querySelector<HTMLElement>(`[data-star="${rating.value}"]`)?.focus()
}

/** Step 1 → 2. The rating is the one required answer: point at it rather than silently refusing. */
function continueFromFeedback() {
  if (rating.value === 0) {
    showRatingHint.value = true
    root.value?.querySelector<HTMLElement>('[data-star="1"]')?.focus()
    return
  }
  stepIndex.value = 1
}

function next() {
  if (stepIndex.value >= LAST) submit(true)
  else stepIndex.value++
}

function back() {
  if (stepIndex.value > 0) stepIndex.value--
}

function skipStep() {
  for (const field of STEP_FIELDS[pilotStep.value]) {
    const current = answers[field]
    ;(answers as Record<string, unknown>)[field] = Array.isArray(current) ? [] : null
  }
  next()
}

function hasAnyAnswer(a: PlayerInsightAnswers) {
  return Object.values(a).some((v) => (Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== ''))
}

function cleanAnswers(): PlayerInsightAnswers {
  const trim = (v: string | null | undefined) => v?.trim() || null
  return {
    ...answers,
    genderSelfDescribe: answers.gender === 'self-describe' ? trim(answers.genderSelfDescribe) : null,
    country: trim(answers.country),
    region: trim(answers.region),
    wantNextText: trim(answers.wantNextText),
    marketingContact: answers.marketingOptIn === true ? trim(answers.marketingContact) : null,
  }
}

function submit(includeProfile: boolean) {
  if (submitting.value) return
  if (rating.value === 0) {
    stepIndex.value = 0
    showRatingHint.value = true
    return
  }
  const profile = includeProfile ? cleanAnswers() : undefined
  sharedProfile.value = !!profile && hasAnyAnswer(profile)
  void fb.submit({
    rating: rating.value,
    likedText: likedText.value.trim() || undefined,
    improveText: improveText.value.trim() || undefined,
    tags: wishes.value,
    additionalComment: additionalComment.value.trim() || undefined,
    recommend: recommend.value ?? undefined,
    profile: sharedProfile.value ? profile : undefined,
  })
}

watch(rating, (r) => {
  if (r > 0) showRatingHint.value = false
})

// "Got it!" — a quick acknowledgement each time an answer is picked.
const gotIt = ref(0)
let gotItTimer: ReturnType<typeof setTimeout> | undefined
function acknowledge() {
  gotIt.value++
  clearTimeout(gotItTimer)
  gotItTimer = setTimeout(() => (gotIt.value = 0), 1100)
}

// Flight-path progress: the plane travels from the first step to the last.
const progress = computed(() => stepIndex.value / LAST)
const counter = computed(
  () => `${String(stepIndex.value + 1).padStart(2, '0')} / ${String(STEPS.length).padStart(2, '0')}`,
)

// Keep Tab inside the dialog; Escape is "maybe later" (or just closes the thank-you screen).
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (stage.value === 'done') fb.close()
    else fb.dismiss()
    return
  }
  if (e.key !== 'Tab' || !root.value) return
  const focusable = [
    ...root.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), textarea, input:not([disabled]), [tabindex="0"]',
    ),
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

/** Puts focus on the natural first control of each stage/step. */
async function focusStage() {
  await nextTick()
  const selector =
    stage.value === 'form'
      ? stepIndex.value === 0
        ? '[data-star="1"]'
        : '[data-step-body] button, [data-step-body] input, [data-autofocus]'
      : '[data-autofocus]'
  root.value?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true })
  root.value?.scrollTo?.({ top: 0 })
}

watch([stage, stepIndex], focusStage)
onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  void focusStage()
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
  clearTimeout(gotItTimer)
})

const fieldClass =
  'mt-1 w-full resize-y border-2 border-violet/50 bg-[oklch(0.15_0.05_285)] px-3 py-1.5 text-base leading-relaxed text-foreground placeholder:text-foreground/50 focus:border-electric focus:outline-none'
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
      <h2
        id="feedback-ask-title"
        class="font-display text-base font-black uppercase leading-snug tracking-[0.12em] text-foreground sm:text-lg"
      >
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
      <p v-else id="feedback-ask-sub" class="mt-3 text-base text-foreground/90">
        Help us make Sky Crash better.
      </p>
      <div class="mt-5 grid grid-cols-2 gap-3">
        <ArcadeButton variant="ghost" size="md" @click="fb.dismiss()">No</ArcadeButton>
        <ArcadeButton variant="primary" size="md" data-autofocus @click="fb.accept()"
          >Yes</ArcadeButton
        >
      </div>
    </div>

    <div
      v-else
      ref="root"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="stage === 'form' ? 'feedback-title' : 'feedback-done-title'"
      :class="stage === 'form' ? (stepIndex === 0 ? 'w-[min(56rem,100%)]' : 'w-[min(48rem,100%)]') : 'w-[min(36rem,100%)]'"
      class="clip-hud relative max-h-[calc(100dvh-1rem)] overflow-y-auto border-2 border-electric bg-void p-4 text-foreground [box-shadow:var(--glow-blue),inset_0_0_32px_color-mix(in_oklab,var(--neon-blue)_14%,transparent)] sm:p-5"
    >
      <!-- 2. The form: a short flight of steps -->
      <template v-if="stage === 'form'">
        <button
          type="button"
          aria-label="Maybe later"
          class="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center border-2 border-violet/60 text-foreground transition-colors hover:border-electric hover:text-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
          @click="fb.dismiss()"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>

        <!-- header: kicker, step counter, title, flight-path progress -->
        <div class="pr-12">
          <p class="flex flex-wrap items-center gap-x-3 gap-y-1 font-arcade text-[0.5rem] uppercase tracking-[0.2em] text-ember">
            <span>{{ step.kicker }}</span>
            <span class="whitespace-nowrap text-foreground/70" :aria-label="`Step ${stepIndex + 1} of ${STEPS.length}`">{{ counter }}</span>
            <span
              v-if="gotIt"
              :key="gotIt"
              class="animate-sky-pop rounded-full border border-lime/70 bg-lime/15 px-2 py-0.5 text-lime"
              role="status"
              >Got it!</span
            >
          </p>
          <h2
            id="feedback-title"
            class="mt-1.5 font-display text-lg font-black uppercase tracking-[0.12em] text-electric text-glow-blue sm:text-xl"
          >
            {{ step.title }}
          </h2>
        </div>
        <div class="relative mt-3 h-6" aria-hidden="true">
          <div class="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-violet/40" />
          <div
            class="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-[image:var(--grad-sunset)] transition-[width] duration-500 ease-out [box-shadow:var(--glow-ember)]"
            :style="{ width: `${progress * 100}%` }"
          />
          <span
            v-for="(s, i) in STEPS"
            :key="s.key"
            :class="[
              'absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 transition-colors',
              i <= stepIndex ? 'bg-ember' : 'bg-violet/50',
            ]"
            :style="{ left: `${(i / LAST) * 100}%` }"
          />
          <Plane
            class="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 text-foreground transition-[left] duration-500 ease-out [filter:drop-shadow(0_0_6px_var(--neon-orange))]"
            :style="{ left: `${progress * 100}%` }"
          />
        </div>

        <!-- Step 1: the main feedback (two columns on wider screens) -->
        <form
          v-if="step.key === 'feedback'"
          class="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-2"
          novalidate
          @submit.prevent="continueFromFeedback"
        >
          <p
            v-if="rewardAvailable"
            class="inline-flex items-center gap-2 justify-self-start border-2 border-lime/70 bg-lime/10 px-3 py-1 text-sm font-bold text-lime md:col-span-2"
          >
            <Gift class="h-4 w-4" aria-hidden="true" />
            Earn {{ rewardCredits.toLocaleString() }} credits for sending it
          </p>

          <div class="space-y-3">
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
                class="mt-1 flex flex-wrap items-center gap-1"
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
                  class="grid h-10 w-10 place-items-center transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
                  @mouseenter="hoverRating = n"
                  @click="rating = n"
                >
                  <Star
                    :class="
                      cn(
                        'h-7 w-7 transition-colors',
                        n <= shownRating
                          ? 'fill-[var(--neon-orange)] text-[var(--neon-orange)]'
                          : 'text-foreground/45',
                      )
                    "
                    aria-hidden="true"
                  />
                </button>
                <span
                  class="ml-2 min-w-[5.5rem] text-base font-bold text-foreground"
                  aria-live="polite"
                >
                  {{ shownRating ? RATING_LABELS[shownRating - 1] : 'Tap a star' }}
                </span>
              </div>
              <p
                v-if="showRatingHint"
                id="feedback-rating-hint"
                role="alert"
                class="mt-1 text-sm font-semibold text-ember"
              >
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
              <span :class="questionClass">What should we improve?</span>
              <textarea
                v-model="improveText"
                :maxlength="MAX_TEXT"
                rows="4"
                placeholder="Anything at all: controls, rewards, sounds, how it plays on your phone…"
                :class="fieldClass"
              />
            </label>
          </div>

          <div class="space-y-3">
            <fieldset>
              <legend :class="questionClass">What would you like us to add?</legend>
              <div class="mt-1 grid grid-cols-2 gap-1.5">
                <label
                  v-for="option in FEATURE_REQUESTS"
                  :key="option.tag"
                  :class="
                    cn(
                      'flex min-h-10 cursor-pointer items-center gap-2 border-2 px-2.5 text-sm font-bold transition-colors focus-within:ring-2 focus-within:ring-electric',
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
              <span :class="questionClass"
                >Anything else? <span class="font-normal text-foreground/70">(optional)</span></span
              >
              <textarea
                v-model="additionalComment"
                :maxlength="MAX_TEXT"
                rows="2"
                :class="fieldClass"
              />
            </label>

            <fieldset>
              <legend :class="questionClass">Would you recommend Sky Crash to a friend?</legend>
              <ChoiceCards
                v-model:value="recommend"
                :options="INSIGHT_OPTIONS.recommend"
                label="Would you recommend Sky Crash to a friend?"
                class="mt-1.5"
              />
            </fieldset>
          </div>

          <p
            v-if="fb.error.value"
            role="alert"
            class="border-2 border-danger bg-danger/15 px-3 py-2 text-sm font-semibold text-foreground md:col-span-2"
          >
            {{ fb.error.value }}
          </p>

          <div class="grid grid-cols-2 gap-3 md:col-span-2 md:flex md:justify-end">
            <ArcadeButton variant="ghost" @click="fb.dismiss()">Maybe later</ArcadeButton>
            <ArcadeButton type="submit" variant="primary">Continue</ArcadeButton>
          </div>
        </form>

        <!-- Step 2: the optional section's intro -->
        <div v-else-if="step.key === 'intro'" class="mt-4" data-step-body>
          <p class="text-lg font-bold leading-snug text-foreground">
            Help us understand who plays Sky Crash so we can create better features, events and content.
          </p>
          <p class="mt-3 flex items-start gap-2 border-2 border-violet/40 bg-violet/10 px-3 py-2 text-sm text-foreground/85">
            <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
            <span>
              These questions are optional and help us understand our player community and improve Sky Crash. Please
              don't provide sensitive personal information. Skipping them doesn't change your reward.
            </span>
          </p>
          <ul class="mt-4 grid grid-cols-2 gap-2 text-sm font-bold sm:grid-cols-4" aria-label="What we'll ask about">
            <li class="clip-hud border border-violet/40 bg-void/60 px-3 py-2">🧑‍✈️ Your pilot profile</li>
            <li class="clip-hud border border-violet/40 bg-void/60 px-3 py-2">🎮 How you play</li>
            <li class="clip-hud border border-violet/40 bg-void/60 px-3 py-2">🚀 What you love</li>
            <li class="clip-hud border border-violet/40 bg-void/60 px-3 py-2">📣 How you found us</li>
          </ul>
          <p v-if="fb.error.value" role="alert" class="mt-3 border-2 border-danger bg-danger/15 px-3 py-2 text-sm font-semibold">
            {{ fb.error.value }}
          </p>
          <div class="mt-5 grid gap-3 sm:flex sm:items-center sm:justify-between">
            <ArcadeButton variant="ghost" @click="back()">Back</ArcadeButton>
            <div class="grid grid-cols-2 gap-3 sm:flex">
              <ArcadeButton variant="blue" :disabled="submitting" @click="submit(false)">
                {{ submitting ? 'Sending…' : 'Skip & send' }}
              </ArcadeButton>
              <ArcadeButton variant="primary" data-autofocus @click="next()">Let's go</ArcadeButton>
            </div>
          </div>
        </div>

        <!-- Steps 3–9: optional pilot-profile questions -->
        <div v-else class="mt-4" data-step-body>
          <!-- Keyed, so each step mounts fresh and slides in. -->
          <PilotProfileStep
            :key="pilotStep"
            v-model:answers="answers"
            :step="pilotStep"
            class="step-slide-in"
            @pick="acknowledge"
          />

          <p v-if="fb.error.value" role="alert" class="mt-3 border-2 border-danger bg-danger/15 px-3 py-2 text-sm font-semibold">
            {{ fb.error.value }}
          </p>

          <div class="mt-5 grid gap-3 sm:flex sm:items-center sm:justify-between">
            <div class="flex gap-3">
              <ArcadeButton variant="ghost" @click="back()">Back</ArcadeButton>
              <button
                type="button"
                class="text-sm font-bold text-foreground/70 underline-offset-4 hover:text-electric hover:underline"
                :disabled="submitting"
                @click="submit(true)"
              >
                Finish now &amp; send
              </button>
            </div>
            <div class="grid grid-cols-2 gap-3 sm:flex">
              <ArcadeButton variant="ghost" :disabled="submitting" @click="skipStep()">Skip</ArcadeButton>
              <ArcadeButton variant="primary" :disabled="submitting" @click="next()">
                {{ stepIndex === LAST ? (submitting ? 'Sending…' : 'Send feedback') : 'Next' }}
              </ArcadeButton>
            </div>
          </div>
        </div>
      </template>

      <!-- 3. Thank-you / reward -->
      <div v-else class="py-2 text-center" role="status">
        <template v-if="creditsAwarded > 0">
          <div
            class="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-lime bg-lime/15 text-lime [box-shadow:var(--glow-lime)]"
          >
            <Coins class="h-8 w-8" aria-hidden="true" />
          </div>
          <h2
            id="feedback-done-title"
            class="animate-sky-pop mt-4 font-arcade text-2xl text-lime text-glow-lime sm:text-3xl"
          >
            +{{ creditsAwarded.toLocaleString() }} Credits
          </h2>
          <p class="mt-3 text-base text-foreground">
            Thanks for your feedback, pilot! The credits are in your balance.
          </p>
          <p v-if="fb.result.value" class="mt-1 text-sm text-foreground/80">
            New balance:
            <span class="font-bold text-foreground">{{
              fb.result.value.newBalance.toLocaleString()
            }}</span>
          </p>
        </template>
        <template v-else>
          <div
            class="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-electric bg-electric/15 text-electric [box-shadow:var(--glow-blue)]"
          >
            <Check class="h-8 w-8" aria-hidden="true" />
          </div>
          <h2
            id="feedback-done-title"
            class="animate-sky-pop mt-4 font-display text-xl font-black uppercase tracking-[0.14em] text-electric"
          >
            Thanks for your feedback
          </h2>
          <p class="mt-3 text-base text-foreground">It helps us make Sky Crash better.</p>
        </template>
        <p v-if="sharedProfile" class="mt-2 text-sm text-foreground/80">
          ✈️ And thanks for telling us about yourself: you're helping shape what we build next.
        </p>
        <ArcadeButton variant="primary" size="lg" class="mt-6" data-autofocus @click="fb.close()">
          {{ doneLabel }}
        </ArcadeButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-slide-in {
  animation: step-slide-in 0.24s ease-out both;
}
@keyframes step-slide-in {
  from {
    opacity: 0;
    transform: translateX(1rem);
  }
}
@media (prefers-reduced-motion: reduce) {
  .step-slide-in {
    animation: none;
  }
}
</style>
