<script setup lang="ts">
import { onMounted } from 'vue'
import { usePaymentStore } from '@/stores/paymentStore'
import NeonPanel from './NeonPanel.vue'

const paymentStore = usePaymentStore()

onMounted(() => {
  paymentStore.fetchPacks()
})

function buyPack(packId: string) {
  // Note: this navigates the whole page away to PayFast's hosted checkout.
  paymentStore.redirectToCheckout(packId)
}
</script>

<template>
  <NeonPanel accent="lime" title="Buy Credits">
    <p class="mb-4 text-xs text-muted-foreground">
      Purchases add credits to your account for play here. They don't withdraw as real money.
      Payment is completed on PayFast's secure checkout page.
    </p>

    <p v-if="paymentStore.isLoadingPacks" class="text-xs text-muted-foreground">Loading packs…</p>
    <p v-else-if="paymentStore.packsError" class="text-xs text-danger">{{ paymentStore.packsError }}</p>
    <p v-else-if="paymentStore.packs.length === 0" class="text-xs text-muted-foreground">
      Online purchases are currently unavailable.
    </p>

    <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <button
        v-for="pack in paymentStore.packs"
        :key="pack.id"
        type="button"
        class="clip-hud border-2 border-violet/50 p-3 text-center transition-all hover:border-lime disabled:pointer-events-none disabled:opacity-40"
        :disabled="paymentStore.isRedirecting"
        @click="buyPack(pack.id)"
      >
        <span class="block font-arcade text-sm text-lime">{{ pack.credits.toLocaleString() }}</span>
        <span class="mt-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          R{{ pack.priceZar.toFixed(2) }}
        </span>
      </button>
    </div>

    <p v-if="paymentStore.isRedirecting" class="mt-4 text-xs text-muted-foreground">
      Taking you to PayFast to complete payment…
    </p>
    <p v-if="paymentStore.errorMessage" class="mt-4 text-xs text-danger">{{ paymentStore.errorMessage }}</p>
  </NeonPanel>
</template>
