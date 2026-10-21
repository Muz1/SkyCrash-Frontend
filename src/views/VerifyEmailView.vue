<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { MailCheck, MailX } from '@lucide/vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import CRTOverlay from '@/components/sky/CRTOverlay.vue'
import SkyEnvironment from '@/components/sky/SkyEnvironment.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import Wordmark from '@/components/sky/Wordmark.vue'
import * as authService from '@/services/AuthService'
import { useAuthStore } from '@/stores/AuthStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useResendVerification } from '@/composables/useResendVerification'
import { en } from '@/copy/en'

/**
 * "Verify email": the confirmation link (/verify-email?token=…) posts its token. Success
 * shows a short "cleared for take-off"; an expired, used or invalid link offers Resend
 * (which needs a session, so signed-out visitors get a login link instead).
 */
const route = useRoute()
const authStore = useAuthStore()
const playerStore = usePlayerStore()
const { resend, sending, message } = useResendVerification()
const t = en.verifyEmail

type State = 'checking' | 'verified' | 'alreadyVerified' | 'expired' | 'used' | 'invalid' | 'noToken'
const state = ref<State>('checking')
const ok = computed(() => state.value === 'verified' || state.value === 'alreadyVerified')
const failLine = computed(() => ({ expired: t.expired, used: t.used, invalid: t.invalid, noToken: t.noToken })[state.value as 'expired'] ?? t.invalid)

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token.trim() : ''
  if (!token) {
    state.value = 'noToken'
    return
  }
  try {
    state.value = await authService.verifyEmail(token)
  } catch {
    state.value = 'invalid'
  }
  if (ok.value && authStore.isAuthenticated) void playerStore.fetchProfile().catch(() => undefined)
})
</script>

<template>
  <div class="relative flex h-dvh flex-col items-center justify-center-safe overflow-y-auto bg-void px-4 py-6">
    <SkyEnvironment skin="sunset-runway" :dim="0.55" />
    <CRTOverlay />
    <div class="relative z-10 w-full max-w-md">
      <div class="mb-6 flex justify-center"><Wordmark compact /></div>
      <NeonPanel :accent="ok ? 'lime' : state === 'checking' ? 'blue' : 'ember'" class="text-center">
        <h1 class="font-display text-xl font-black uppercase tracking-[0.18em] text-foreground">{{ t.name }}</h1>

        <p v-if="state === 'checking'" class="mt-4 text-sm text-muted-foreground" role="status">{{ t.checking }}</p>

        <template v-else-if="ok">
          <MailCheck class="mx-auto mt-4 h-10 w-10 text-lime" aria-hidden="true" />
          <p class="mt-2 font-display text-base font-black uppercase tracking-[0.16em] text-lime text-glow-lime" role="status">
            {{ state === 'verified' ? t.done : t.already }}
          </p>
          <p class="mt-1 text-sm text-foreground/85">{{ state === 'verified' ? t.doneLine : t.alreadyLine }}</p>
          <RouterLink :to="authStore.isAuthenticated ? '/game' : '/login'" class="mt-5 inline-block">
            <ArcadeButton size="lg" tabindex="-1">{{ authStore.isAuthenticated ? t.play : en.common.signIn }}</ArcadeButton>
          </RouterLink>
        </template>

        <template v-else>
          <MailX class="mx-auto mt-4 h-10 w-10 text-ember" aria-hidden="true" />
          <p class="mt-2 text-base font-semibold text-foreground" role="alert">{{ failLine }}</p>
          <p v-if="message" class="mt-2 text-sm text-lime" role="status">{{ message }}</p>
          <ArcadeButton v-if="authStore.isAuthenticated" type="button" size="lg" variant="magenta" class="mt-5" :disabled="sending" @click="resend">
            {{ t.resend }}
          </ArcadeButton>
          <RouterLink v-else :to="{ name: 'login', query: { redirect: '/profile' } }" class="mt-5 inline-block">
            <ArcadeButton size="lg" variant="magenta" tabindex="-1">{{ t.loginToResend }}</ArcadeButton>
          </RouterLink>
        </template>
      </NeonPanel>
    </div>
  </div>
</template>
