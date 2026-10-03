<script setup lang="ts">
import ChoiceCards from './ChoiceCards.vue'
import { INSIGHT_OPTIONS, type PilotStep, type PlayerInsightAnswers } from '@/types/feedback'

/**
 * One optional "Tell us about you" step of the feedback questionnaire. Every question can be
 * left blank; the parent (FeedbackPrompt) owns navigation, Skip and submission.
 */

defineProps<{ step: PilotStep }>()
const answers = defineModel<PlayerInsightAnswers>('answers', { required: true })
const emit = defineEmits<{ pick: [] }>()

const MAX_COUNTRY = 60
const fieldClass =
  'mt-1 w-full border-2 border-violet/50 bg-[oklch(0.15_0.05_285)] px-3 py-2 text-base text-foreground placeholder:text-foreground/50 focus:border-electric focus:outline-none'
const questionClass = 'block text-base font-bold leading-snug text-foreground'
const hintClass = 'font-normal text-foreground/65'

const COUNTRIES = ['South Africa', 'Namibia', 'Botswana', 'Zimbabwe', 'Kenya', 'Nigeria', 'United Kingdom', 'United States', 'Australia', 'India']
</script>

<template>
  <!-- Single root element so the parent's step transition can animate it. -->
  <div>
  <!-- Pilot profile -->
  <div v-if="step === 'pilot'" class="space-y-5">
    <fieldset>
      <legend :class="questionClass">What's your age range?</legend>
      <ChoiceCards v-model:value="answers.ageRange" :options="INSIGHT_OPTIONS.ageRange" label="Age range" class="mt-2" @pick="emit('pick')" />
    </fieldset>

    <fieldset>
      <legend :class="questionClass">How do you identify?</legend>
      <ChoiceCards v-model:value="answers.gender" :options="INSIGHT_OPTIONS.gender" label="Gender" class="mt-2" @pick="emit('pick')" />
      <label v-if="answers.gender === 'self-describe'" class="mt-2 block">
        <span class="sr-only">Describe how you identify</span>
        <input v-model="answers.genderSelfDescribe" maxlength="40" placeholder="How you'd describe yourself (optional)" :class="fieldClass" />
      </label>
    </fieldset>

    <fieldset>
      <legend :class="questionClass">Where are you based? <span :class="hintClass">Country and, if you like, your province or region. No addresses please.</span></legend>
      <div class="mt-1 grid gap-2 sm:grid-cols-2">
        <label class="block">
          <span class="sr-only">Country</span>
          <input v-model="answers.country" :maxlength="MAX_COUNTRY" list="pilot-countries" placeholder="Country" autocomplete="country-name" :class="fieldClass" />
          <datalist id="pilot-countries">
            <option v-for="c in COUNTRIES" :key="c" :value="c" />
          </datalist>
        </label>
        <label class="block">
          <span class="sr-only">Province, state or region (optional)</span>
          <input v-model="answers.region" :maxlength="MAX_COUNTRY" placeholder="Province / state / region (optional)" autocomplete="address-level1" :class="fieldClass" />
        </label>
      </div>
    </fieldset>

    <fieldset>
      <legend :class="questionClass">What best describes you?</legend>
      <ChoiceCards v-model:value="answers.occupation" :options="INSIGHT_OPTIONS.occupation" label="Occupation" variant="card" class="mt-2" @pick="emit('pick')" />
    </fieldset>
  </div>

  <!-- Gaming style -->
  <div v-else-if="step === 'style'" class="space-y-5">
    <fieldset>
      <legend :class="questionClass">How often do you play games?</legend>
      <ChoiceCards v-model:value="answers.playFrequency" :options="INSIGHT_OPTIONS.playFrequency" label="How often you play" class="mt-2" @pick="emit('pick')" />
    </fieldset>
    <fieldset>
      <legend :class="questionClass">What do you usually play on? <span :class="hintClass">Pick all that apply.</span></legend>
      <ChoiceCards v-model:values="answers.devices" multiple :options="INSIGHT_OPTIONS.devices" label="Devices" variant="card" class="mt-2" @pick="emit('pick')" />
    </fieldset>
    <fieldset>
      <legend :class="questionClass">How long is your typical gaming session?</legend>
      <ChoiceCards v-model:value="answers.sessionLength" :options="INSIGHT_OPTIONS.sessionLength" label="Session length" class="mt-2" @pick="emit('pick')" />
    </fieldset>
    <fieldset>
      <legend :class="questionClass">What types of games do you enjoy? <span :class="hintClass">Pick all that apply.</span></legend>
      <ChoiceCards v-model:values="answers.gameGenres" multiple :options="INSIGHT_OPTIONS.gameGenres" label="Game types" class="mt-2" @pick="emit('pick')" />
    </fieldset>
  </div>

  <!-- Motivation -->
  <div v-else-if="step === 'motivation'" class="space-y-5">
    <fieldset>
      <legend :class="questionClass">What makes a game fun for you? <span :class="hintClass">Pick all that apply.</span></legend>
      <ChoiceCards v-model:values="answers.motivations" multiple :options="INSIGHT_OPTIONS.motivations" label="What makes a game fun" variant="card" class="mt-2" @pick="emit('pick')" />
    </fieldset>
    <fieldset>
      <legend :class="questionClass">What made you try Sky Crash?</legend>
      <ChoiceCards v-model:value="answers.triedBecause" :options="INSIGHT_OPTIONS.triedBecause" label="Why you tried Sky Crash" class="mt-2" @pick="emit('pick')" />
    </fieldset>
  </div>

  <!-- Favourite features -->
  <div v-else-if="step === 'features'" class="space-y-5">
    <fieldset>
      <legend :class="questionClass">Your favourite parts <span :class="hintClass">Pick all that apply.</span></legend>
      <ChoiceCards v-model:values="answers.favouriteFeatures" multiple :options="INSIGHT_OPTIONS.favouriteFeatures" label="Favourite parts" variant="card" class="mt-2" @pick="emit('pick')" />
    </fieldset>
    <fieldset>
      <legend :class="questionClass">What would you like us to add next?</legend>
      <ChoiceCards v-model:values="answers.wantNext" multiple :options="INSIGHT_OPTIONS.wantNext" label="What to add next" class="mt-2" @pick="emit('pick')" />
      <label class="mt-3 block">
        <span class="text-sm font-bold text-foreground/85">Got a specific idea?</span>
        <textarea v-model="answers.wantNextText" maxlength="500" rows="3" placeholder="e.g. a night-time city sky with fireworks" :class="[fieldClass, 'resize-y leading-relaxed']" />
      </label>
    </fieldset>
  </div>

  <!-- Discovery -->
  <div v-else-if="step === 'discovery'" class="space-y-5">
    <fieldset>
      <legend :class="questionClass">Where did you hear about Sky Crash?</legend>
      <ChoiceCards v-model:value="answers.discoverySource" :options="INSIGHT_OPTIONS.discoverySource" label="Where you heard about Sky Crash" variant="card" class="mt-2" @pick="emit('pick')" />
    </fieldset>
    <fieldset>
      <legend :class="questionClass">Which social platforms do you use most? <span :class="hintClass">Pick all that apply.</span></legend>
      <ChoiceCards v-model:values="answers.socialPlatforms" multiple :options="INSIGHT_OPTIONS.socialPlatforms" label="Social platforms" class="mt-2" @pick="emit('pick')" />
    </fieldset>
  </div>

  <!-- Marketing hook -->
  <div v-else-if="step === 'hook'">
    <fieldset>
      <legend :class="questionClass">
        If you saw Sky Crash in your social media feed, what would make you want to check it out?
        <span :class="hintClass">Pick all that apply.</span>
      </legend>
      <ChoiceCards v-model:values="answers.scrollHooks" multiple :options="INSIGHT_OPTIONS.scrollHooks" label="What would make you stop scrolling" variant="card" class="mt-3" @pick="emit('pick')" />
    </fieldset>
  </div>

  <!-- Marketing opt-in -->
  <div v-else-if="step === 'optin'" class="space-y-4">
    <fieldset>
      <legend :class="questionClass">Would you like to hear about new Sky Crash features, events and updates?</legend>
      <div role="radiogroup" aria-label="Hear from us" class="mt-3 grid grid-cols-2 gap-3 sm:max-w-sm">
        <button
          v-for="choice in [{ v: true, label: 'Yes please', emoji: '📬' }, { v: false, label: 'No thanks', emoji: '🙅' }]"
          :key="String(choice.v)"
          type="button"
          role="radio"
          :aria-checked="answers.marketingOptIn === choice.v"
          :class="[
            'clip-hud flex min-h-14 items-center justify-center gap-2 border-2 px-3 text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric active:scale-[0.97]',
            answers.marketingOptIn === choice.v
              ? 'border-electric bg-electric/20 [box-shadow:var(--glow-blue)]'
              : 'border-violet/50 bg-void/60 hover:border-electric',
          ]"
          @click="((answers.marketingOptIn = answers.marketingOptIn === choice.v ? null : choice.v), emit('pick'))"
        >
          <span aria-hidden="true">{{ choice.emoji }}</span>{{ choice.label }}
        </button>
      </div>
    </fieldset>
    <label v-if="answers.marketingOptIn === true" class="block animate-sky-pop">
      <span :class="questionClass">Where can we reach you? <span :class="hintClass">Optional: an email or your Discord/Instagram handle.</span></span>
      <input v-model="answers.marketingContact" maxlength="254" placeholder="pilot@example.com or @handle" autocomplete="email" :class="fieldClass" />
    </label>
    <p class="text-sm text-foreground/70">
      You can still play and send feedback either way. We'll only use this to tell you about Sky Crash, and you can change your
      answer next time you send feedback.
    </p>
  </div>
  </div>
</template>
