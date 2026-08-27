<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/AuthStore'
import { usePlayerStore } from '../stores/playerStore'


const authStore = useAuthStore()
const playerStore = usePlayerStore()
const router = useRouter()
const route = useRoute()
const isMobileMenuOpen = ref(false)

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated && !playerStore.profile) {
      playerStore.fetchProfile()
    } else if (!isAuthenticated) {
      playerStore.clear()
    }
  },
  { immediate: true },
)

watch(route, () => {
  isMobileMenuOpen.value = false
})

function handleLogout() {
  isMobileMenuOpen.value = false
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <nav v-if="authStore.isAuthenticated" class="bg-aviator-900 border-b border-gold-600/30 relative">
    <div class="px-4 sm:px-6 py-3 flex items-center justify-between">
      <RouterLink to="/" class="text-lg font-black italic tracking-wide text-gold-400" style="text-shadow: 0 0 12px rgba(240,193,75,0.4)">
        SKYCRASH
      </RouterLink>

      <!-- Desktop nav -->
      <div class="hidden md:flex items-center gap-4 text-sm">
        <RouterLink to="/wallet" class="flex items-center gap-1.5 rounded-md bg-aviator-950/60 border border-gold-600/20 px-3 py-1.5 text-rose-200/70 hover:text-gold-300 hover:border-gold-500/40 transition">
          Credits: <span class="text-gold-300 font-semibold">{{ playerStore.profile?.creditBalance ?? '—' }}</span>
        </RouterLink>
        <RouterLink
          v-if="playerStore.profile?.isAdmin"
          to="/ops"
          class="text-gold-400 hover:text-gold-300"
        >
          Operations
        </RouterLink>
        <RouterLink v-if="playerStore.profile?.isAdmin" to="/rtp" class="text-amber-400 hover:text-amber-300">
  RTP
</RouterLink>

        <RouterLink to="/profile" class="text-rose-200/80 hover:text-gold-300 transition">
          {{ playerStore.profile?.username ?? authStore.username }}
        </RouterLink>
        <RouterLink to="/history" class="text-rose-200/80 hover:text-gold-300 transition">History</RouterLink>
        <RouterLink to="/lobby" class="text-rose-200/80 hover:text-gold-300 transition">Lobby</RouterLink>
        <RouterLink to="/leaderboard" class="text-rose-200/80 hover:text-gold-300 transition">Leaderboard</RouterLink>
        <RouterLink to="/game" class="rounded-md bg-aviator-500 hover:bg-aviator-400 text-white px-3 py-1.5 font-semibold transition shadow-[0_0_14px_rgba(156,28,31,0.6)]">
          Play
        </RouterLink>
        <button @click="handleLogout" class="text-rose-300/60 hover:text-aviator-400 transition">
          Log out
        </button>
      </div>

      <!-- Mobile hamburger toggle -->
      <button
        type="button"
        class="md:hidden -mr-2 p-2 text-rose-200/80 hover:text-gold-300"
        :aria-expanded="isMobileMenuOpen"
        aria-label="Toggle navigation menu"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <svg v-if="!isMobileMenuOpen" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile dropdown menu -->
    <div v-if="isMobileMenuOpen" class="md:hidden border-t border-gold-600/20 px-4 py-3 space-y-1 text-sm bg-aviator-900">
      <RouterLink
        to="/wallet"
        class="block rounded-md px-3 py-2 text-rose-200/70 hover:bg-aviator-850 hover:text-gold-300"
      >
        Credits: <span class="text-gold-300 font-semibold">{{ playerStore.profile?.creditBalance ?? '—' }}</span>
      </RouterLink>
      <RouterLink
        v-if="playerStore.profile?.isAdmin"
        to="/ops"
        class="block rounded-md px-3 py-2 text-gold-400 hover:bg-aviator-850 hover:text-gold-300"
      >
        Operations
      </RouterLink>
      <RouterLink to="/profile" class="block rounded-md px-3 py-2 text-rose-200/80 hover:bg-aviator-850 hover:text-gold-300">
        {{ playerStore.profile?.username ?? authStore.username }}
      </RouterLink>
      <RouterLink to="/history" class="block rounded-md px-3 py-2 text-rose-200/80 hover:bg-aviator-850 hover:text-gold-300">History</RouterLink>
      <RouterLink to="/lobby" class="block rounded-md px-3 py-2 text-rose-200/80 hover:bg-aviator-850 hover:text-gold-300">Lobby</RouterLink>
      <RouterLink to="/leaderboard" class="block rounded-md px-3 py-2 text-rose-200/80 hover:bg-aviator-850 hover:text-gold-300">Leaderboard</RouterLink>
      <RouterLink to="/game" class="block rounded-md px-3 py-2 text-white bg-aviator-500 hover:bg-aviator-400 font-semibold">Play</RouterLink>
      <button
        @click="handleLogout"
        class="w-full text-left rounded-md px-3 py-2 text-rose-300/60 hover:bg-aviator-850 hover:text-aviator-400 transition"
      >
        Log out
      </button>
    </div>
  </nav>
</template>
