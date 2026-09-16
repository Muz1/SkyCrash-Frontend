<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useWalletStore } from '@/stores/walletStore'
import Shell from '@/components/sky/Shell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'

const playerStore = usePlayerStore()
const walletStore = useWalletStore()
const isToppingUp = ref(false)
const claimed = ref<number | null>(null)

onMounted(() => {
  walletStore.fetchTransactions()
})

async function handleTopUp() {
  isToppingUp.value = true
  claimed.value = null
  try {
    await walletStore.requestDemoTopUp()
    claimed.value = 1000
  } catch {
    // errorMessage is already set on the store; nothing further to do here.
  } finally {
    isToppingUp.value = false
  }
}
</script>

<template>
  <Shell skin="deep-space" :dim="0.55">
    <div class="mx-auto w-full max-w-2xl text-center">
      <h1 class="font-display text-2xl font-black uppercase tracking-[0.2em] text-ember text-glow-ember sm:text-3xl">
        Your Credits
      </h1>

      <NeonPanel class="mt-6" accent="ember">
        <p class="font-arcade text-4xl text-ember text-glow-ember sm:text-5xl">
          {{ (playerStore.profile?.creditBalance ?? 0).toLocaleString() }}
        </p>
        <p class="mt-2 font-arcade text-[8px] uppercase tracking-[0.4em] text-muted-foreground">Arcade balance</p>

        <button
          class="clip-hud mt-7 w-full border-2 border-violet/60 bg-void/60 p-4 transition-all hover:border-lime hover:[box-shadow:var(--glow-lime)] disabled:pointer-events-none disabled:opacity-40"
          :disabled="isToppingUp"
          @click="handleTopUp"
        >
          <span class="block font-arcade text-base text-lime">+1,000</span>
          <span class="mt-1 block font-display text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            {{ isToppingUp ? 'Refuelling…' : 'Add Demo Credits' }}
          </span>
        </button>

        <p role="status" class="mt-5 min-h-5 font-arcade text-[8px] uppercase tracking-[0.28em] text-lime">
          {{ claimed ? `Insert coin — ${claimed.toLocaleString()} credits loaded` : '' }}
        </p>
        <p v-if="walletStore.errorMessage" class="mt-2 font-arcade text-[8px] uppercase tracking-[0.28em] text-danger">
          {{ walletStore.errorMessage }}
        </p>

        <RouterLink to="/game" class="mt-4 inline-block">
          <ArcadeButton size="lg">Back To The Sky</ArcadeButton>
        </RouterLink>
      </NeonPanel>

      <p class="mt-6 text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Prototype interface — no real payments are processed.
      </p>

      <NeonPanel class="mt-6 text-left" title="Transaction History" accent="blue">
        <p v-if="walletStore.transactions.length === 0" class="text-sm text-muted-foreground">No transactions yet.</p>
        <div v-else class="divide-y divide-border/60">
          <div v-for="tx in walletStore.transactions" :key="tx.id" class="flex items-center justify-between py-3 text-sm">
            <div>
              <div class="font-display text-xs uppercase tracking-[0.18em] text-foreground">{{ tx.type }}</div>
              <div class="text-xs text-muted-foreground">{{ new Date(tx.createdAtUtc).toLocaleString() }}</div>
            </div>
            <div class="text-right">
              <div :class="tx.amount >= 0 ? 'text-lime' : 'text-danger'" class="font-arcade text-sm">
                {{ tx.amount >= 0 ? '+' : '' }}{{ tx.amount }}
              </div>
              <div class="text-xs text-muted-foreground">Balance: {{ tx.balanceAfter }}</div>
            </div>
          </div>
        </div>
      </NeonPanel>
    </div>
  </Shell>
</template>
