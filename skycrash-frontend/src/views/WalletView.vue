<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useWalletStore } from '@/stores/walletStore'

const playerStore = usePlayerStore()
const walletStore = useWalletStore()
const isToppingUp = ref(false)

onMounted(() => {
  walletStore.fetchTransactions()
})

async function handleTopUp() {
  isToppingUp.value = true
  try {
    await walletStore.requestDemoTopUp()
  } catch {
    // errorMessage is already set on the store; nothing further to do here.
  } finally {
    isToppingUp.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 flex justify-center">
    <div class="w-full max-w-md space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Wallet</h1>
        <span class="text-lg">{{ playerStore.profile?.creditBalance ?? '—' }} credits</span>
      </div>

      <button
        @click="handleTopUp"
        :disabled="isToppingUp"
        class="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-2 font-medium transition"
      >
        {{ isToppingUp ? 'Adding…' : 'Add 1,000 demo credits' }}
      </button>
      <p v-if="walletStore.errorMessage" class="text-sm text-red-400">{{ walletStore.errorMessage }}</p>

      <div>
        <h2 class="text-sm text-slate-400 mb-2">Transaction history</h2>
        <div class="bg-slate-900 rounded-xl divide-y divide-slate-800">
          <div v-if="walletStore.transactions.length === 0" class="p-4 text-slate-400 text-sm">
            No transactions yet.
          </div>
          <div
            v-for="tx in walletStore.transactions"
            :key="tx.id"
            class="p-4 flex items-center justify-between text-sm"
          >
            <div>
              <div>{{ tx.type }}</div>
              <div class="text-slate-500">{{ new Date(tx.createdAtUtc).toLocaleString() }}</div>
            </div>
            <div class="text-right">
              <div :class="tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'">
                {{ tx.amount >= 0 ? '+' : '' }}{{ tx.amount }}
              </div>
              <div class="text-slate-500">Balance: {{ tx.balanceAfter }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>