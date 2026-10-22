<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/AuthStore'
import { usePublicSettingsStore } from '@/stores/publicSettingsStore'
import * as authService from '@/services/AuthService'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import ArcadeField from '@/components/sky/ArcadeField.vue'
import CRTOverlay from '@/components/sky/CRTOverlay.vue'
import SkyEnvironment from '@/components/sky/SkyEnvironment.vue'
import Wordmark from '@/components/sky/Wordmark.vue'
import BlockedPanel from '@/components/sky/BlockedPanel.vue'
import GoogleSignIn from '@/components/sky/GoogleSignIn.vue'
import { apiError, apiMessage } from '@/lib/apiError'
import { isAtLeast18, latestAdultDob } from '@/lib/age'
import type { BlockedLogin } from '@/types'
import { en } from '@/copy/en'

/**
 * Sign in. Steps: email + password → (if the server emailed one) the 6-digit code →
 * signed in. A blocked account gets its own screen (rule, end date, appeal); too many
 * failed tries shows the lockout message. Google sign-in appears only when configured, and
 * a brand-new Google account first confirms its age and the two agreements.
 */
const authStore = useAuthStore()
const publicSettings = usePublicSettingsStore()
const router = useRouter()
const route = useRoute()
const t = en.login

type Step = 'credentials' | 'otp' | 'blocked' | 'googleProfile'
const step = ref<Step>('credentials')

const email = ref('')
const password = ref('')
const errorMessage = ref(
  route.query.blocked
    ? 'Your account has been blocked. Contact support.'
    : route.query.expired
      ? 'Your session expired — please log in again.'
      : '',
)
const isSubmitting = ref(false)

const challengeId = ref<string | null>(null)
const code = ref('')
const otpInput = ref<HTMLInputElement | null>(null)

const block = ref<BlockedLogin | null>(null)

// Signed up but hasn't opened the confirmation link yet: offer a fresh one.
const unverifiedEmail = ref<string | null>(null)
const resendNote = ref('')
async function resendVerification() {
  if (!unverifiedEmail.value) return
  try {
    await authService.resendVerificationByEmail(unverifiedEmail.value)
    resendNote.value = en.register.sent
  } catch {
    resendNote.value = en.common.tryAgain
  }
}

// New Google account: age gate and the two ticks, then the credential is posted again.
const googleToken = ref<string | null>(null)
const dob = ref('')
const agreeTerms = ref(false)
const agreeRules = ref(false)
const maxDob = latestAdultDob()

onMounted(() => void publicSettings.load())
const googleClientId = computed(() => publicSettings.googleClientId)

function finish() {
  // Back to the page that asked for a login (e.g. Play); the router sends admins to their console.
  const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/'
  router.push(redirect)
}

/** Shared handling for 403 (blocked), 429 (locked out) and plain failures. */
function handleError(err: unknown, fallback: string) {
  const { status, data } = apiError<BlockedLogin & { message?: string; code?: string; email?: string }>(err)
  if (status === 403 && data?.code === 'email-unverified') {
    unverifiedEmail.value = data.email ?? email.value
    resendNote.value = ''
    errorMessage.value = t.unverified
    return
  }
  if (status === 403 && data && 'sanction' in data) {
    block.value = data
    step.value = 'blocked'
    return
  }
  if (status === 429) {
    errorMessage.value = apiMessage(err) ?? t.lockedOut
    return
  }
  errorMessage.value = apiMessage(err) ?? fallback
}

async function startOtp(id: string) {
  challengeId.value = id
  code.value = ''
  errorMessage.value = ''
  step.value = 'otp'
  await nextTick()
  otpInput.value?.focus()
}

async function handleSubmit() {
  errorMessage.value = ''
  unverifiedEmail.value = null
  isSubmitting.value = true
  try {
    const result = await authStore.login({ email: email.value, password: password.value })
    if (result.kind === 'otp') await startOtp(result.challengeId)
    else finish()
  } catch (err: unknown) {
    handleError(err, 'Login failed. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

async function submitOtp() {
  errorMessage.value = ''
  const digits = code.value.replace(/\D/g, '')
  if (digits.length !== 6 || !challengeId.value) {
    errorMessage.value = t.otpInvalid
    return
  }
  isSubmitting.value = true
  try {
    await authStore.completeOtp(challengeId.value, digits)
    finish()
  } catch (err: unknown) {
    handleError(err, t.otpInvalid)
    // Expired / too many tries: the server wants a fresh sign-in.
    const msg = apiMessage(err) ?? ''
    if (/sign in again/i.test(msg)) backToCredentials(msg)
  } finally {
    isSubmitting.value = false
  }
}

function backToCredentials(message = '') {
  step.value = 'credentials'
  challengeId.value = null
  block.value = null
  googleToken.value = null
  errorMessage.value = message
}

async function postGoogle(extra: { dateOfBirth?: string; acceptTerms?: boolean; acceptRules?: boolean } = {}) {
  if (!googleToken.value) return
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    const result = await authService.google({ idToken: googleToken.value, ...extra })
    if (result.kind === 'needsProfile') step.value = 'googleProfile'
    else if (result.kind === 'otp') await startOtp(result.challengeId)
    else {
      authStore.setSession(result.auth)
      finish()
    }
  } catch (err: unknown) {
    handleError(err, t.googleFailed)
  } finally {
    isSubmitting.value = false
  }
}

function onGoogleCredential(idToken: string) {
  googleToken.value = idToken
  void postGoogle()
}

function submitGoogleProfile() {
  errorMessage.value = ''
  if (!dob.value) return void (errorMessage.value = en.register.dobRequired)
  if (!isAtLeast18(dob.value)) return void (errorMessage.value = en.register.under18)
  if (!agreeTerms.value || !agreeRules.value) return void (errorMessage.value = en.register.rulesRequired)
  void postGoogle({ dateOfBirth: dob.value, acceptTerms: true, acceptRules: true })
}
</script>

<template>
  <div class="relative flex h-dvh flex-col items-center justify-center-safe overflow-y-auto bg-void px-4 py-6">
    <SkyEnvironment skin="sunset-runway" :dim="0.55" />
    <CRTOverlay />

    <div class="relative z-10 w-full max-w-md">
      <!-- The logo is itself the link home (see Wordmark). -->
      <div class="mb-6 flex justify-center"><Wordmark compact /></div>

      <BlockedPanel v-if="step === 'blocked' && block" :block="block" @back="backToCredentials()" />

      <form v-else-if="step === 'otp'" class="neon-panel clip-hud crt-scan p-6 sm:p-8" @submit.prevent="submitOtp">
        <h1 class="text-center font-display text-xl font-black uppercase tracking-[0.18em] text-electric text-glow-blue">{{ t.otpTitle }}</h1>
        <p class="mt-1 text-center text-sm text-foreground/85">{{ t.otpLine }}</p>
        <label class="mt-6 block">
          <span class="mb-1.5 block font-display text-[0.5625rem] uppercase tracking-[0.3em] text-muted-foreground">{{ t.otpLabel }}</span>
          <input
            ref="otpInput"
            v-model="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            pattern="[0-9]*"
            maxlength="6"
            placeholder="••••••"
            class="clip-hud w-full border-2 border-violet/50 bg-void/70 px-3 py-2.5 text-center font-arcade text-xl tracking-[0.5em] text-foreground placeholder:text-muted-foreground/60 focus:border-electric focus:outline-none"
          />
        </label>
        <p v-if="errorMessage" role="alert" class="mt-4 font-arcade text-[0.5rem] uppercase leading-relaxed text-danger">{{ errorMessage }}</p>
        <ArcadeButton type="submit" size="lg" variant="blue" class="mt-6 w-full" :disabled="isSubmitting">
          {{ isSubmitting ? en.common.loading : t.otpSubmit }}
        </ArcadeButton>
        <div class="mt-4 flex justify-center">
          <ArcadeButton type="button" size="sm" variant="ghost" @click="backToCredentials()">{{ t.otpBack }}</ArcadeButton>
        </div>
      </form>

      <form v-else-if="step === 'googleProfile'" class="neon-panel clip-hud crt-scan p-6 sm:p-8" @submit.prevent="submitGoogleProfile">
        <h1 class="text-center font-display text-xl font-black uppercase tracking-[0.18em] text-lime text-glow-lime">{{ t.googleProfileTitle }}</h1>
        <p class="mt-1 text-center text-sm text-foreground/85">{{ t.googleProfileLine }}</p>
        <div class="mt-6 space-y-3">
          <ArcadeField v-model="dob" :label="en.register.dob" type="date" :max="maxDob" required />
          <label class="flex cursor-pointer items-center gap-3 text-base pointer-coarse:min-h-11">
            <input v-model="agreeTerms" type="checkbox" class="h-5 w-5 shrink-0 accent-[var(--neon-lime)]" />
            <span>{{ t.termsTick }}</span>
          </label>
          <label class="flex cursor-pointer items-center gap-3 text-base pointer-coarse:min-h-11">
            <input v-model="agreeRules" type="checkbox" class="h-5 w-5 shrink-0 accent-[var(--neon-lime)]" />
            <span>{{ en.register.rulesTick }} <RouterLink to="/rules" target="_blank" class="text-electric underline">{{ en.register.rulesLink }}</RouterLink></span>
          </label>
        </div>
        <p v-if="errorMessage" role="alert" class="mt-4 font-arcade text-[0.5rem] uppercase leading-relaxed text-danger">{{ errorMessage }}</p>
        <ArcadeButton type="submit" size="lg" variant="cash" class="mt-6 w-full" :disabled="isSubmitting">{{ t.continue }}</ArcadeButton>
        <div class="mt-4 flex justify-center">
          <ArcadeButton type="button" size="sm" variant="ghost" @click="backToCredentials()">{{ t.otpBack }}</ArcadeButton>
        </div>
      </form>

      <form v-else class="neon-panel clip-hud crt-scan p-6 sm:p-8" @submit.prevent="handleSubmit">
        <h1 class="text-center font-display text-xl font-black uppercase tracking-[0.18em] text-magenta text-glow-magenta">
          Welcome Back, Pilot
        </h1>
        <p class="mt-1 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">Cleared for boarding</p>

        <div class="mt-7 space-y-4">
          <ArcadeField v-model="email" label="Email" type="email" autocomplete="email" placeholder="pilot@skycrash.io" required />
          <ArcadeField
            v-model="password"
            label="Password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            required
          />
        </div>

        <div class="mt-2 text-right">
          <RouterLink to="/forgot-password" class="text-xs font-semibold text-electric underline-offset-2 hover:underline">{{ en.recovery.forgotLink }}</RouterLink>
        </div>

        <p v-if="errorMessage" role="alert" class="mt-4 font-arcade text-[0.5rem] uppercase leading-relaxed text-danger">
          {{ errorMessage }}
        </p>
        <div v-if="unverifiedEmail" class="mt-2">
          <ArcadeButton type="button" size="sm" variant="ghost" @click="resendVerification">{{ t.resend }}</ArcadeButton>
          <p v-if="resendNote" class="mt-1 text-sm text-lime" role="status">{{ resendNote }}</p>
        </div>

        <ArcadeButton type="submit" size="lg" variant="primary" class="mt-7 w-full" :disabled="isSubmitting">
          {{ isSubmitting ? 'Preparing Aircraft…' : 'Login' }}
        </ArcadeButton>

        <GoogleSignIn v-if="googleClientId" :client-id="googleClientId" class="mt-4" @credential="onGoogleCredential" @error="errorMessage = t.googleFailed" />

        <p class="mt-5 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          New here?
          <RouterLink to="/register" class="text-lime hover:text-glow-lime">Create account</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
