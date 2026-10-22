<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import ArcadeField from '@/components/sky/ArcadeField.vue'
import CRTOverlay from '@/components/sky/CRTOverlay.vue'
import SkyEnvironment from '@/components/sky/SkyEnvironment.vue'
import Wordmark from '@/components/sky/Wordmark.vue'
import * as authService from '@/services/AuthService'
import { apiError, apiMessage } from '@/lib/apiError'
import { en } from '@/copy/en'

/**
 * The reset link (/reset-password?token=…) lands here. The token works once, for an hour;
 * an expired, used or invalid link offers "Send a new link".
 */
const route = useRoute()
const t = en.recovery
const token = typeof route.query.token === 'string' ? route.query.token.trim() : ''

const password = ref('')
const confirm = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const status = ref<authService.ResetPasswordStatus | null>(token ? null : 'invalid')
const failLine = computed(() => (status.value === 'expired' ? t.expired : status.value === 'used' ? t.used : t.invalid))

async function handleSubmit() {
  errorMessage.value = ''
  if (password.value !== confirm.value) return void (errorMessage.value = t.mismatch)
  isSubmitting.value = true
  try {
    status.value = await authService.resetPassword(token, password.value)
  } catch (err: unknown) {
    const { data } = apiError<{ status?: authService.ResetPasswordStatus }>(err)
    if (data?.status) status.value = data.status
    else errorMessage.value = apiMessage(err) ?? en.common.tryAgain
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
      <div class="neon-panel clip-hud crt-scan p-6 text-center sm:p-8">
        <h1 class="font-display text-xl font-black uppercase tracking-[0.18em] text-electric text-glow-blue">{{ t.resetTitle }}</h1>

        <template v-if="status === 'reset'">
          <p class="mt-4 text-sm text-lime" role="status">{{ t.done }}</p>
          <RouterLink to="/login" class="mt-5 inline-block"><ArcadeButton size="lg" tabindex="-1">{{ en.common.signIn }}</ArcadeButton></RouterLink>
        </template>

        <template v-else-if="status">
          <p class="mt-4 text-base font-semibold text-foreground" role="alert">{{ failLine }}</p>
          <RouterLink to="/forgot-password" class="mt-5 inline-block"><ArcadeButton size="lg" variant="magenta" tabindex="-1">{{ t.askAgain }}</ArcadeButton></RouterLink>
        </template>

        <form v-else class="text-left" @submit.prevent="handleSubmit">
          <p class="mt-1 text-center text-sm text-foreground/85">{{ t.resetLine }}</p>
          <div class="mt-6 space-y-4">
            <ArcadeField v-model="password" :label="t.newPassword" type="password" autocomplete="new-password" placeholder="••••••••" required />
            <ArcadeField v-model="confirm" :label="t.confirm" type="password" autocomplete="new-password" placeholder="••••••••" required />
          </div>
          <p v-if="errorMessage" role="alert" class="mt-4 font-arcade text-[0.5rem] uppercase leading-relaxed text-danger">{{ errorMessage }}</p>
          <ArcadeButton type="submit" size="lg" variant="blue" class="mt-6 w-full" :disabled="isSubmitting">
            {{ isSubmitting ? en.common.loading : t.save }}
          </ArcadeButton>
        </form>
      </div>
    </div>
  </div>
</template>
