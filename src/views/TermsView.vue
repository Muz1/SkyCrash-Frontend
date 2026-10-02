<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import CRTOverlay from '@/components/sky/CRTOverlay.vue'
import SkyEnvironment from '@/components/sky/SkyEnvironment.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import Wordmark from '@/components/sky/Wordmark.vue'
import TermsContent from '@/components/sky/TermsContent.vue'
import { useAuthStore } from '@/stores/AuthStore'
import { usePlayerStore } from '@/stores/playerStore'
import * as playerService from '@/services/playerService'
import { TERMS_VERSION } from '@/lib/terms'

/**
 * The Terms of Service. Anyone can read it; a signed-in player who hasn't agreed to the
 * current version is sent here by the router before their next flight, and agrees here.
 */
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const playerStore = usePlayerStore()

const needsAgreement = computed(
  () =>
    authStore.isAuthenticated &&
    !!playerStore.profile &&
    !playerStore.profile.isAdmin &&
    playerStore.profile.hasAcceptedTerms === false,
)
const agreed = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const redirect = computed(() =>
  typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
    ? route.query.redirect
    : '/game',
)

async function accept() {
  if (!agreed.value) return
  saving.value = true
  error.value = null
  try {
    playerStore.profile = await playerService.acceptTerms(TERMS_VERSION)
    await router.replace(redirect.value)
  } catch (err: unknown) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data
    error.value = data?.message ?? 'Could not save your agreement. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="relative min-h-dvh overflow-hidden bg-void">
    <div class="absolute inset-0"><SkyEnvironment skin="midnight" :dim="0.6" /></div>
    <CRTOverlay />
    <main class="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-8">
      <Wordmark class="w-48" />
      <NeonPanel accent="blue" class="mt-6 w-full">
        <h1 class="font-display text-2xl font-black uppercase tracking-[0.14em] text-foreground">
          Terms of Service
        </h1>
        <p v-if="needsAgreement" class="mt-2 text-base text-foreground/90">
          Before your next flight, please read and agree to the Sky Crash Terms of Service.
        </p>

        <div
          class="mt-3 max-h-[52vh] overflow-y-auto border-2 border-violet/40 bg-void/60 p-4"
          tabindex="0"
          aria-label="Terms of Service text"
        >
          <TermsContent />
        </div>

        <form v-if="needsAgreement" class="mt-5" @submit.prevent="accept">
          <label
            class="flex cursor-pointer items-start gap-3 border-2 border-lime/50 bg-lime/5 p-3 text-base text-foreground"
          >
            <input
              v-model="agreed"
              type="checkbox"
              class="mt-1 h-5 w-5 shrink-0 accent-[var(--neon-lime)]"
            />
            <span>I agree to the Terms of Service</span>
          </label>
          <p v-if="error" role="alert" class="mt-3 text-sm font-semibold text-danger">
            {{ error }}
          </p>
          <ArcadeButton
            type="submit"
            size="lg"
            variant="cash"
            class="mt-4 w-full"
            :disabled="!agreed || saving"
          >
            {{ saving ? 'Saving…' : 'Agree and continue' }}
          </ArcadeButton>
        </form>
        <div v-else class="mt-5 flex justify-center">
          <ArcadeButton type="button" size="md" variant="ghost" @click="router.back()"
            >Back</ArcadeButton
          >
        </div>
      </NeonPanel>
    </main>
  </div>
</template>
