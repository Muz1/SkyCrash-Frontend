<script setup lang="ts">
import { ref } from 'vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import ArcadeField from '@/components/sky/ArcadeField.vue'
import CRTOverlay from '@/components/sky/CRTOverlay.vue'
import SkyEnvironment from '@/components/sky/SkyEnvironment.vue'
import Wordmark from '@/components/sky/Wordmark.vue'
import * as authService from '@/services/AuthService'
import { apiMessage } from '@/lib/apiError'
import { en } from '@/copy/en'

/**
 * "Forgot password": emails a one-hour reset link. The answer is the same whether or not
 * the email has an account, so the page can't be used to find out who plays here.
 */
const t = en.recovery
const email = ref('')
const sent = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await authService.forgotPassword(email.value.trim())
    sent.value = true
  } catch (err: unknown) {
    errorMessage.value = apiMessage(err) ?? en.common.tryAgain
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
      <div class="mb-6 flex justify-center"><Wordmark compact /></div>
      <form class="neon-panel clip-hud crt-scan p-6 sm:p-8" @submit.prevent="handleSubmit">
        <h1 class="text-center font-display text-xl font-black uppercase tracking-[0.18em] text-electric text-glow-blue">{{ t.forgotTitle }}</h1>
        <p class="mt-1 text-center text-sm text-foreground/85">{{ t.forgotLine }}</p>

        <p v-if="sent" class="mt-6 text-center text-sm text-lime" role="status">{{ t.sent }}</p>
        <template v-else>
          <div class="mt-6">
            <ArcadeField v-model="email" label="Email" type="email" autocomplete="email" placeholder="pilot@skycrash.io" required />
          </div>
          <p v-if="errorMessage" role="alert" class="mt-4 font-arcade text-[0.5rem] uppercase leading-relaxed text-danger">{{ errorMessage }}</p>
          <ArcadeButton type="submit" size="lg" variant="blue" class="mt-6 w-full" :disabled="isSubmitting">
            {{ isSubmitting ? en.common.loading : t.send }}
          </ArcadeButton>
        </template>

        <p class="mt-5 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <RouterLink to="/login" class="text-electric hover:text-glow-blue">{{ en.common.signIn }}</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
