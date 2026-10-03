<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/AuthStore'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import ArcadeField from '@/components/sky/ArcadeField.vue'
import CRTOverlay from '@/components/sky/CRTOverlay.vue'
import SkyEnvironment from '@/components/sky/SkyEnvironment.vue'
import Wordmark from '@/components/sky/Wordmark.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

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

async function handleSubmit() {
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await authStore.login({ email: email.value, password: password.value })
    // Back to the page that asked for a login (e.g. Play); the router sends admins to their console.
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/'
    router.push(redirect)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response?: { data?: { message?: string } } }).response
      errorMessage.value = response?.data?.message ?? 'Login failed. Please try again.'
    } else {
      errorMessage.value = 'Login failed. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="relative flex h-dvh flex-col items-center justify-center-safe overflow-y-auto bg-void px-4 py-6">
    <SkyEnvironment skin="sunset-runway" :dim="0.55" />
    <CRTOverlay />

    <div class="relative z-10 w-full max-w-md">
      <RouterLink to="/" class="mb-6 block text-center" aria-label="Back to the Sky Crash home page">
        <Wordmark compact />
      </RouterLink>

      <form class="neon-panel clip-hud crt-scan p-6 sm:p-8" @submit.prevent="handleSubmit">
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

        <p v-if="errorMessage" role="alert" class="mt-4 font-arcade text-[0.5rem] uppercase leading-relaxed text-danger">
          {{ errorMessage }}
        </p>

        <ArcadeButton type="submit" size="lg" variant="primary" class="mt-7 w-full" :disabled="isSubmitting">
          {{ isSubmitting ? 'Preparing Aircraft…' : 'Login' }}
        </ArcadeButton>

        <p class="mt-5 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          New here?
          <RouterLink to="/register" class="text-lime hover:text-glow-lime">Create account</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
