<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LogOut, ArrowLeft } from '@lucide/vue'
import { useAuthStore } from '@/stores/AuthStore'
import { usePlayerStore } from '@/stores/playerStore'
import CRTOverlay from './CRTOverlay.vue'
import AdminTabs from './AdminTabs.vue'
import Wordmark from './Wordmark.vue'
import HelpTip from './HelpTip.vue'

defineProps<{ helpText?: string }>()

const router = useRouter()
const authStore = useAuthStore()
const playerStore = usePlayerStore()

function handleLogout() {
  authStore.logout()
  playerStore.clear()
  router.push('/login')
}
</script>

<template>
  <div class="relative min-h-screen bg-[oklch(0.09_0.015_285)]">
    <CRTOverlay />

    <header
      class="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-ember/30 bg-void/85 px-4 py-4 sm:px-8"
    >
      <div class="flex items-center gap-3">
        <Wordmark compact />
        <span class="clip-hud border border-ember/60 px-2 py-1 font-arcade text-[8px] uppercase tracking-[0.3em] text-ember">
          Admin Console
        </span>
      </div>
      <div class="flex items-center gap-2">
        <RouterLink
          to="/"
          class="clip-hud flex items-center gap-1.5 border-2 border-violet/50 px-3 py-2 font-arcade text-[8px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-electric hover:text-electric"
        >
          <ArrowLeft class="h-3 w-3" aria-hidden="true" /> Player App
        </RouterLink>
        <button
          type="button"
          class="clip-hud flex items-center gap-1.5 border-2 border-danger/60 px-3 py-2 font-arcade text-[8px] uppercase tracking-[0.2em] text-danger transition-colors hover:bg-danger/10"
          @click="handleLogout"
        >
          <LogOut class="h-3 w-3" aria-hidden="true" /> Logout
        </button>
      </div>
    </header>

    <div class="relative z-10 px-4 py-6 sm:px-8">
      <div class="mx-auto w-full max-w-5xl">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <AdminTabs />
          <HelpTip v-if="helpText" :text="helpText" />
        </div>
        <div class="mt-5">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
