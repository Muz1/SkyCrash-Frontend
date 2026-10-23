<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import CRTOverlay from '@/components/sky/CRTOverlay.vue'
import SkyEnvironment from '@/components/sky/SkyEnvironment.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import Wordmark from '@/components/sky/Wordmark.vue'
import * as authService from '@/services/AuthService'
import { useAuthStore } from '@/stores/AuthStore'
import { usePlayerStore } from '@/stores/playerStore'
import { apiError, apiMessage } from '@/lib/apiError'

/**
 * Quick-access link (/play/:token, usually opened from a QR code): signs that panel pilot in
 * without a password and lands on the home page. A revoked link or a blocked account gets a
 * short explanation instead.
 */
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const playerStore = usePlayerStore()
const failure = ref('')

onMounted(async () => {
  const token = typeof route.params.token === 'string' ? route.params.token : ''
  try {
    const auth = await authService.linkLogin(token)
    // Replace whoever was signed in on this device.
    authStore.logout()
    playerStore.clear()
    authStore.setSession(auth)
    await playerStore.fetchProfile().catch(() => undefined)
    await router.replace('/')
  } catch (err) {
    const { status } = apiError(err)
    failure.value =
      status === 403
        ? 'This pilot account is blocked right now.'
        : (apiMessage(err) ?? "This link doesn't work any more. Ask the team for a new one.")
  }
})
</script>

<template>
  <div class="relative flex h-dvh flex-col items-center justify-center-safe overflow-y-auto bg-void px-4 py-6">
    <SkyEnvironment skin="sunset-runway" :dim="0.55" />
    <CRTOverlay />
    <div class="relative z-10 w-full max-w-md">
      <div class="mb-6 flex justify-center"><Wordmark compact /></div>
      <NeonPanel :accent="failure ? 'ember' : 'blue'" class="text-center">
        <p v-if="!failure" class="font-display text-base font-black uppercase tracking-[0.16em] text-electric" role="status">Boarding your pilot…</p>
        <template v-else>
          <p class="text-base font-semibold text-foreground" role="alert">{{ failure }}</p>
          <RouterLink to="/login" class="mt-5 inline-block">
            <ArcadeButton size="lg" variant="magenta" tabindex="-1">Go to login</ArcadeButton>
          </RouterLink>
        </template>
      </NeonPanel>
    </div>
  </div>
</template>
