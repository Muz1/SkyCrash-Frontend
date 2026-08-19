<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/AuthStore'
import { usePlayerStore } from '../stores/playerStore'


const authStore = useAuthStore()
const playerStore = usePlayerStore()
const router = useRouter()
const route = useRoute()
const isMobileMenuOpen = ref(false)

onMounted(() => {
  if (authStore.isAuthenticated && !playerStore.profile) {
    playerStore.fetchProfile()
  }
})

watch(route, () => {
  isMobileMenuOpen.value = false
})

function handleLogout() {
  isMobileMenuOpen.value = false
  authStore.logout()
  playerStore.clear()
  router.push('/login')
}
</script>

<template>
  <nav v-if="authStore.isAuthenticated" class="bg-slate-900 border-b border-slate-800 relative">
    <div class="px-4 sm:px-6 py-3 flex items-center justify-between">
      <RouterLink to="/" class="text-lg font-bold text-slate-100">SkyCrash</RouterLink>

      <!-- Desktop nav -->
      <div class="hidden md:flex items-center gap-4 text-sm">
        <RouterLink to="/wallet" class="text-slate-400 hover:text-slate-200">
          Credits: <span class="text-slate-100 font-medium">{{ playerStore.profile?.creditBalance ?? '—' }}</span>
        </RouterLink>
        <RouterLink
          v-if="playerStore.profile?.isAdmin"
          to="/ops"
          class="text-amber-400 hover:text-amber-300"
        >
          Operations
        </RouterLink>
        <RouterLink to="/profile" class="text-slate-300 hover:text-slate-100">
          {{ playerStore.profile?.username ?? authStore.username }}
        </RouterLink>
        <RouterLink to="/history" class="text-slate-300 hover:text-slate-100">History</RouterLink>
        <RouterLink to="/lobby" class="text-slate-300 hover:text-slate-100">Lobby</RouterLink>
        <RouterLink to="/leaderboard" class="text-slate-300 hover:text-slate-100">Leaderboard</RouterLink>
        <RouterLink to="/game" class="text-slate-300 hover:text-slate-100">Play</RouterLink>
        <button @click="handleLogout" class="text-slate-400 hover:text-red-400 transition">
          Log out
        </button>
      </div>

      <!-- Mobile hamburger toggle -->
      <button
        type="button"
        class="md:hidden -mr-2 p-2 text-slate-300 hover:text-slate-100"
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
    <div v-if="isMobileMenuOpen" class="md:hidden border-t border-slate-800 px-4 py-3 space-y-1 text-sm bg-slate-900">
      <RouterLink
        to="/wallet"
        class="block rounded-md px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      >
        Credits: <span class="text-slate-100 font-medium">{{ playerStore.profile?.creditBalance ?? '—' }}</span>
      </RouterLink>
      <RouterLink
        v-if="playerStore.profile?.isAdmin"
        to="/ops"
        class="block rounded-md px-3 py-2 text-amber-400 hover:bg-slate-800 hover:text-amber-300"
      >
        Operations
      </RouterLink>
      <RouterLink to="/profile" class="block rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
        {{ playerStore.profile?.username ?? authStore.username }}
      </RouterLink>
      <RouterLink to="/history" class="block rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-slate-100">History</RouterLink>
      <RouterLink to="/lobby" class="block rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-slate-100">Lobby</RouterLink>
      <RouterLink to="/leaderboard" class="block rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-slate-100">Leaderboard</RouterLink>
      <RouterLink to="/game" class="block rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-slate-100">Play</RouterLink>
      <button
        @click="handleLogout"
        class="w-full text-left rounded-md px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition"
      >
        Log out
      </button>
    </div>
  </nav>
</template>