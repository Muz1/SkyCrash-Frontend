<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Shell from "@/components/sky/Shell.vue";
import ArcadeButton from "@/components/sky/ArcadeButton.vue";
import NeonPanel from "@/components/sky/NeonPanel.vue";
import { useAuthStore } from "@/stores/auth";
import { useWalletStore } from "@/stores/wallet";

const auth = useAuthStore();
const wallet = useWalletStore();
const credits = computed(() => auth.player?.creditBalance ?? 0);
const claiming = ref(false);
const claimed = ref(false);

onMounted(() => {
  wallet.fetchTransactions();
});

async function claim() {
  claiming.value = true;
  claimed.value = false;
  const ok = await wallet.demoTopup();
  claimed.value = ok;
  claiming.value = false;
  if (ok) wallet.fetchTransactions();
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
          {{ Math.round(credits).toLocaleString() }}
        </p>
        <p class="mt-2 font-arcade text-[8px] uppercase tracking-[0.4em] text-muted-foreground">Arcade balance</p>

        <div class="mt-7">
          <ArcadeButton size="lg" variant="cash" :disabled="claiming" @click="claim">
            {{ claiming ? "Refuelling…" : "Claim 1,000 Demo Credits" }}
          </ArcadeButton>
        </div>

        <p
          role="status"
          class="mt-5 min-h-5 font-arcade text-[8px] uppercase tracking-[0.28em]"
          :class="wallet.topupError ? 'text-danger' : 'text-lime'"
        >
          {{ wallet.topupError || (claimed ? "Insert coin — 1,000 credits loaded" : "") }}
        </p>

        <RouterLink to="/play" class="mt-4 inline-block">
          <ArcadeButton size="lg">Back To The Sky</ArcadeButton>
        </RouterLink>
      </NeonPanel>

      <NeonPanel v-if="wallet.transactions.length > 0" class="mt-5 text-left" title="Recent Transactions" accent="blue">
        <ul class="space-y-2">
          <li
            v-for="t in wallet.transactions.slice(0, 10)"
            :key="t.id"
            class="clip-hud flex items-center justify-between border border-violet/30 bg-void/50 px-3 py-2"
          >
            <span class="font-arcade text-[8px] uppercase text-muted-foreground">{{ t.description || t.type }}</span>
            <span class="font-arcade text-[10px]" :class="t.amount >= 0 ? 'text-lime' : 'text-danger'">
              {{ t.amount >= 0 ? "+" : "" }}{{ Math.round(t.amount).toLocaleString() }}
            </span>
          </li>
        </ul>
      </NeonPanel>

      <p class="mt-6 text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Demo credits only — no real payments are processed.
      </p>
    </div>
  </Shell>
</template>
