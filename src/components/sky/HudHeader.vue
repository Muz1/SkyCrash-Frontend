<script setup lang="ts">
import { ShieldCheck } from '@lucide/vue'
import { usePlayerStore } from '@/stores/playerStore'
import CreditDisplay from './CreditDisplay.vue'
import Wordmark from './Wordmark.vue'

const playerStore = usePlayerStore()
</script>

<template>
  <header class="relative z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-8">
    <div class="min-w-0">
      <Wordmark compact />
    </div>
    <div class="flex items-center gap-2 justify-self-end">
      <RouterLink
        v-if="playerStore.profile?.isAdmin"
        to="/admin"
        aria-label="Admin"
        class="grid h-9 w-9 shrink-0 place-items-center border-2 border-ember/70 bg-void/70 text-ember clip-hud transition-all hover:[box-shadow:var(--glow-ember)]"
      >
        <ShieldCheck class="h-4 w-4" aria-hidden="true" />
      </RouterLink>
      <RouterLink to="/wallet" aria-label="Wallet" class="transition-transform hover:-translate-y-0.5">
        <CreditDisplay :credits="playerStore.profile?.creditBalance ?? 0" />
      </RouterLink>
    </div>
  </header>
</template>
