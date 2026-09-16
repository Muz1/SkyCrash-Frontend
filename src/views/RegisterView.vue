<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/AuthStore'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import ArcadeField from '@/components/sky/ArcadeField.vue'
import CRTOverlay from '@/components/sky/CRTOverlay.vue'
import SkyEnvironment from '@/components/sky/SkyEnvironment.vue'
import Wordmark from '@/components/sky/Wordmark.vue'

const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreedToTerms = ref(false)
const errorMessage = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  errorMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isSubmitting.value = true
  try {
    await authStore.register({ username: username.value, email: email.value, password: password.value })
    router.push('/')
  } catch (err: unknown) {
    type AxiosLikeError = { response?: { data?: unknown } }
    const data = (err as AxiosLikeError).response?.data as unknown
    if (Array.isArray(data)) {
      errorMessage.value = data.join(' ')
    } else if (data && typeof data === 'object' && 'message' in (data as Record<string, unknown>)) {
      errorMessage.value = String((data as Record<string, unknown>).message)
    } else {
      errorMessage.value = 'Registration failed.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="relative grid min-h-screen place-items-center overflow-hidden bg-void px-4 py-12">
    <SkyEnvironment skin="cloud-city" :dim="0.55" />
    <CRTOverlay />

    <div class="relative z-10 w-full max-w-md">
      <div class="mb-8 text-center">
        <Wordmark compact />
      </div>

      <form class="neon-panel clip-hud crt-scan p-6 sm:p-8" @submit.prevent="handleSubmit">
        <h1 class="text-center font-display text-xl font-black uppercase tracking-[0.18em] text-lime text-glow-lime">
          Join The Flight
        </h1>
        <p class="mt-1 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">Register your call sign</p>

        <div class="mt-7 space-y-4">
          <ArcadeField v-model="username" label="Username" placeholder="pilot_name" required />
          <ArcadeField v-model="email" label="Email" type="email" placeholder="pilot@skycrash.io" required />
          <ArcadeField v-model="password" label="Password" type="password" placeholder="••••••••" required />
          <ArcadeField v-model="confirmPassword" label="Confirm Password" type="password" placeholder="••••••••" required />
        </div>

        <label class="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <input v-model="agreedToTerms" type="checkbox" required class="accent-[var(--neon-lime)]" />I agree to the flight
          terms
        </label>

        <p v-if="errorMessage" role="alert" class="mt-4 font-arcade text-[8px] uppercase leading-relaxed text-danger">
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
  </div>
</template>
