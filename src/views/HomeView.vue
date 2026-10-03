<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessageSquareHeart, Warehouse } from '@lucide/vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useAuthStore } from '@/stores/AuthStore'
import { useLobbyStore } from '@/stores/lobbyStore'
import { useHangarStore } from '@/stores/hangarStore'
import { useFeedbackForm } from '@/composables/useFeedbackPrompt'
import SkyEnvironment from '@/components/sky/SkyEnvironment.vue'
import CRTOverlay from '@/components/sky/CRTOverlay.vue'
import Plane from '@/components/sky/Plane.vue'
import NavDock from '@/components/sky/NavDock.vue'
import HudHeader from '@/components/sky/HudHeader.vue'
import Wordmark from '@/components/sky/Wordmark.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import HowToPlay from '@/components/sky/HowToPlay.vue'
import FeedbackPrompt from '@/components/sky/FeedbackPrompt.vue'

const playerStore = usePlayerStore()
const authStore = useAuthStore()
const lobbyStore = useLobbyStore()
const hangarStore = useHangarStore()
const feedback = useFeedbackForm()
const route = useRoute()
const router = useRouter()

/** Signed-in pilots get the form right here; visitors sign in first and come back to it. */
function giveFeedback() {
  if (authStore.isAuthenticated) feedback.openForm()
  else router.push({ name: 'login', query: { redirect: '/?feedback=1' } })
}

onMounted(() => {
  // Home is public: only load account data for signed-in pilots.
  if (!authStore.isAuthenticated) return
  if (!playerStore.profile) playerStore.fetchProfile()
  lobbyStore.fetchOnlinePlayers()
  // Back from logging in via "Give us feedback".
  if (route.query.feedback === '1') {
    feedback.openForm()
    router.replace({ query: {} })
  }
})
</script>

<template>
  <!-- Exactly one screen: header, hero + how to play (flex-1), nav dock. Never scrolls. -->
  <div class="relative flex h-dvh flex-col overflow-hidden bg-void">
    <SkyEnvironment skin="sunset-runway" :dim="0.22" priority />
    <CRTOverlay />

    <HudHeader />

    <div
      class="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center"
    >
      <Plane
        :craft="hangarStore.craftId"
        :size="200"
        class="mb-1 !h-[clamp(56px,12dvh,170px)] !w-[clamp(56px,12dvh,170px)] -translate-x-6 sm:mb-2"
      />

      <h1 class="sr-only">Sky Crash</h1>
      <div aria-hidden>
        <Wordmark />
      </div>

      <!-- The two main actions: side by side on desktop, Join Lobby directly beneath Play Now on phones. -->
      <div class="mt-[clamp(0.75rem,2.5dvh,1.5rem)] flex w-full max-w-sm flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
        <!-- Logged-out players are sent to log in first, then straight on to the game. -->
        <RouterLink to="/game" class="block">
          <ArcadeButton size="xl" variant="primary" class="w-full">Play Now</ArcadeButton>
        </RouterLink>
        <RouterLink to="/lobby" class="block">
          <ArcadeButton size="lg" variant="blue" class="w-full">Join Lobby</ArcadeButton>
        </RouterLink>
      </div>

      <!-- Secondary actions. -->
      <div class="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <RouterLink to="/hangar" :class="hangarStore.isCustomized ? 'hangar-glow' : undefined">
          <ArcadeButton size="md" variant="ghost" :class="hangarStore.isCustomized ? '!border-lime !text-lime' : '!text-foreground'">
            <Warehouse class="h-4 w-4" aria-hidden="true" />
            <span>Hangar <span class="hidden font-sans font-bold normal-case tracking-normal xs:inline">· Change plane &amp; sky</span></span>
          </ArcadeButton>
        </RouterLink>
        <ArcadeButton size="md" variant="ghost" class="!text-foreground" @click="giveFeedback">
          <MessageSquareHeart class="h-4 w-4" aria-hidden="true" /> Give Us Feedback
        </ArcadeButton>
        <RouterLink v-if="!authStore.isAuthenticated" to="/register">
          <ArcadeButton size="md" variant="magenta">Create Account</ArcadeButton>
        </RouterLink>
        <!-- Same destination as Join Lobby, so phones skip it to keep the hero on one screen. -->
        <RouterLink v-else to="/lobby" class="hidden sm:block">
          <ArcadeButton size="md" variant="ghost">{{ lobbyStore.onlinePlayers.length }} {{ lobbyStore.onlinePlayers.length === 1 ? 'Pilot' : 'Pilots' }} Online</ArcadeButton>
        </RouterLink>
      </div>

      <HowToPlay class="mt-[clamp(0.75rem,3dvh,1.5rem)]" />
      <RouterLink
        to="/game?tutorial=1"
        class="mt-2 font-arcade text-[0.5625rem] uppercase tracking-[0.2em] text-electric underline-offset-4 hover:text-foreground hover:underline"
      >
        Watch the full tutorial
      </RouterLink>

      <p class="mt-4 font-arcade text-[0.5rem] uppercase tracking-[0.3em] text-violet [@media(max-height:900px)]:hidden">
        High risk. High thrill. Beat the sky.
      </p>
    </div>

    <NavDock />

    <FeedbackPrompt v-if="feedback.isOpen.value" :controller="feedback" done-label="Back to Sky Crash" />
  </div>
</template>
