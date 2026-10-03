<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/AuthStore'
import * as authService from '@/services/AuthService'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import ArcadeField from '@/components/sky/ArcadeField.vue'
import CRTOverlay from '@/components/sky/CRTOverlay.vue'
import SkyEnvironment from '@/components/sky/SkyEnvironment.vue'
import Wordmark from '@/components/sky/Wordmark.vue'
import TermsContent from '@/components/sky/TermsContent.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreedToTerms = ref(false)
const showTerms = ref(false)
const errorMessage = ref('')
const isSubmitting = ref(false)

const usernameStatus = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
const usernameSuggestions = ref<string[]>([])
let usernameCheckTimer: ReturnType<typeof setTimeout> | undefined

watch(username, (value) => {
  usernameSuggestions.value = []
  if (usernameCheckTimer) clearTimeout(usernameCheckTimer)

  const candidate = value.trim()
  if (candidate.length < 3) {
    usernameStatus.value = 'idle'
    return
  }

  usernameStatus.value = 'checking'
  usernameCheckTimer = setTimeout(async () => {
    try {
      const result = await authService.checkUsername(candidate)
      if (username.value.trim() !== candidate) return // stale response
      usernameStatus.value = result.available ? 'available' : 'taken'
      usernameSuggestions.value = result.suggestions
    } catch {
      usernameStatus.value = 'idle'
    }
  }, 400)
})

function applySuggestion(suggestion: string) {
  username.value = suggestion
}

async function handleSubmit() {
  errorMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  if (!agreedToTerms.value) {
    errorMessage.value = 'Please agree to the Terms of Service to create your account.'
    return
  }

  isSubmitting.value = true
  try {
    await authStore.register({ username: username.value, email: email.value, password: password.value, acceptTerms: true })
    // Back to where they came from (e.g. an admin invite link), else the landing page.
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/'
    router.push(redirect)
  } catch (err: unknown) {
    type AxiosLikeError = { response?: { data?: unknown } }
    const data = (err as AxiosLikeError).response?.data as unknown
    if (Array.isArray(data)) {
      errorMessage.value = data.join(' ')
    } else if (data && typeof data === 'object' && 'message' in (data as Record<string, unknown>)) {
      const record = data as Record<string, unknown>
      errorMessage.value = String(record.message)
      if (record.field === 'username' && Array.isArray(record.suggestions)) {
        usernameStatus.value = 'taken'
        usernameSuggestions.value = record.suggestions as string[]
      }
    } else {
      errorMessage.value = 'Registration failed.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="relative flex h-dvh flex-col items-center justify-center-safe overflow-y-auto bg-void px-4 py-6">
    <SkyEnvironment skin="cloud-city" :dim="0.55" />
    <CRTOverlay />

    <div class="relative z-10 w-full max-w-md">
      <RouterLink to="/" class="mb-6 block text-center" aria-label="Back to the Sky Crash home page">
        <Wordmark compact />
      </RouterLink>

      <form class="neon-panel clip-hud crt-scan p-6 sm:p-8" @submit.prevent="handleSubmit">
        <h1 class="text-center font-display text-xl font-black uppercase tracking-[0.18em] text-lime text-glow-lime">
          Join The Flight
        </h1>
        <p class="mt-1 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">Register your call sign</p>

        <div class="mt-7 space-y-4">
          <div>
            <ArcadeField v-model="username" label="Username" placeholder="pilot_name" required />
            <p v-if="usernameStatus === 'checking'" class="mt-1 text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
              Checking availability…
            </p>
            <p v-else-if="usernameStatus === 'available'" class="mt-1 text-[0.625rem] uppercase tracking-[0.2em] text-lime">
              Available
            </p>
            <div v-else-if="usernameStatus === 'taken'" class="mt-1.5">
              <p class="text-[0.625rem] uppercase tracking-[0.2em] text-danger">That username is already taken.</p>
              <div v-if="usernameSuggestions.length > 0" class="mt-1.5 flex flex-wrap gap-1.5">
                <button
                  v-for="suggestion in usernameSuggestions"
                  :key="suggestion"
                  type="button"
                  class="clip-hud border border-electric/50 px-2 py-1 text-[0.625rem] text-electric transition-all hover:[box-shadow:var(--glow-blue)]"
                  @click="applySuggestion(suggestion)"
                >
                  {{ suggestion }}
                </button>
              </div>
            </div>
          </div>
          <ArcadeField v-model="email" label="Email" type="email" placeholder="pilot@skycrash.io" required />
          <ArcadeField v-model="password" label="Password" type="password" placeholder="••••••••" required />
          <ArcadeField v-model="confirmPassword" label="Confirm Password" type="password" placeholder="••••••••" required />
        </div>

        <div class="mt-5 border-2 border-lime/50 bg-lime/5 p-3">
          <label class="flex cursor-pointer items-start gap-3 text-base text-foreground">
            <input v-model="agreedToTerms" type="checkbox" required class="mt-1 h-5 w-5 shrink-0 accent-[var(--neon-lime)]" />
            <span>I agree to the Terms of Service</span>
          </label>
          <button
            type="button"
            class="mt-1.5 pl-8 text-sm font-semibold text-electric underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
            @click="showTerms = true"
          >
            Read the Terms of Service
          </button>
        </div>

        <p v-if="errorMessage" role="alert" class="mt-4 font-arcade text-[0.5rem] uppercase leading-relaxed text-danger">
          {{ errorMessage }}
        </p>

        <ArcadeButton type="submit" size="lg" variant="cash" class="mt-6 w-full" :disabled="isSubmitting">
          {{ isSubmitting ? 'Establishing Flight Path…' : 'Create Account' }}
        </ArcadeButton>

        <p class="mt-5 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Already a pilot?
          <RouterLink to="/login" class="text-electric hover:text-glow-blue">Login</RouterLink>
        </p>
      </form>
    </div>

    <div v-if="showTerms" class="fixed inset-0 z-[90] grid place-items-center bg-void/80 p-4 backdrop-blur-sm" @click.self="showTerms = false">
      <section role="dialog" aria-modal="true" aria-labelledby="terms-title" class="neon-panel clip-hud flex max-h-[85dvh] w-full max-w-xl flex-col p-5">
        <h2 id="terms-title" class="font-display text-xl font-black uppercase tracking-[0.14em] text-foreground">Terms of Service</h2>
        <div class="mt-3 min-h-0 flex-1 overflow-y-auto border-2 border-violet/40 bg-void/60 p-4" tabindex="0">
          <TermsContent />
        </div>
        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <ArcadeButton type="button" size="md" variant="ghost" @click="showTerms = false">Close</ArcadeButton>
          <ArcadeButton type="button" size="md" variant="cash" @click="((agreedToTerms = true), (showTerms = false))">I agree</ArcadeButton>
        </div>
      </section>
    </div>
  </div>
</template>
