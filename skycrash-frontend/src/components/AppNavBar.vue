<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/AuthStore'
import { usePlayerStore } from '../stores/playerStore'


const authStore = useAuthStore()
const playerStore = usePlayerStore()
const router = useRouter()

onMounted(() => {
  if (authStore.isAuthenticated && !playerStore.profile) {
    playerStore.fetchProfile()
  }
})

function handleLogout() {
  authStore.logout()
  playerStore.clear()
  router.push('/login')
}
</script>

<template>
  <nav v-if="authStore.isAuthenticated" class="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
    <RouterLink to="/" class="text-lg font-bold text-slate-100">SkyCrash</RouterLink>

    
    
    <div class="flex items-center gap-4 text-sm">
      <span class="text-slate-400">
        <RouterLink to="/wallet" class="text-slate-400 hover:text-slate-200">
        Credits: <span class="text-slate-100 font-medium">{{ playerStore.profile?.creditBalance ?? '—' }}</span>
        </RouterLink>
        

      </span>
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
  </nav>
</template>