<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/playerStore'
import { useWalletStore } from '@/stores/walletStore'
import { usePaymentStore } from '@/stores/paymentStore'
import Shell from '@/components/sky/Shell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import BuyCreditsPanel from '@/components/sky/BuyCreditsPanel.vue'
import SpinTimerChip from '@/components/sky/SpinTimerChip.vue'
import { useSpinStore } from '@/stores/spinStore'
import { usePublicSettingsStore } from '@/stores/publicSettingsStore'
import InfoTip from '@/components/sky/InfoTip.vue'
import * as walletService from '@/services/walletService'
import { creditAmount, dateShort } from '@/lib/format'
import { en } from '@/copy/en'
import type { WalletBalanceDetail } from '@/types'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()
const walletStore = useWalletStore()
const paymentStore = usePaymentStore()
const spinStore = useSpinStore()
const publicSettings = usePublicSettingsStore()

// Actual crediting happens once PayFast's ITN reaches our backend, which is
// slightly delayed relative to this redirect - not confirmed yet, just "in progress".
const purchaseStatus = ref<'success' | 'cancelled' | null>(null)
const isAwaitingCredit = ref(false)
const wasCredited = ref(false)
/** Cash vs bonus split (bonus must be wagered before it turns into cash). */
const balance = ref<WalletBalanceDetail | null>(null)

onMounted(async () => {
  walletStore.fetchTransactions()
  walletService
    .getBalance()
    .then((b) => (balance.value = b))
    .catch(() => undefined)
  if (!spinStore.status) void spinStore.load()
  // "Buy credits" in the top bar links to #buy-credits: scroll the panel into view once it's shown.
  void publicSettings.load().then(async () => {
    if (route.hash !== '#buy-credits') return
    await nextTick()
    document.getElementById('buy-credits')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })

  const payment = route.query.payment
  if (payment === 'success' || payment === 'cancelled') {
    purchaseStatus.value = payment
    // Strip the query param so a page refresh doesn't re-trigger this.
    router.replace({ query: {} })

    if (payment === 'success') {
      isAwaitingCredit.value = true
      wasCredited.value = await paymentStore.refreshBalanceAfterPurchase()
      isAwaitingCredit.value = false
    }
  }
})
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
        <p class="mt-2 font-arcade text-[0.5rem] uppercase tracking-[0.4em] text-muted-foreground">Arcade balance</p>

        <dl v-if="balance" class="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-2 text-left">
          <div class="clip-hud border border-violet/40 bg-void/50 p-2">
            <dt class="font-arcade text-[0.4375rem] uppercase tracking-[0.2em] text-muted-foreground">{{ en.wallet.cash }}</dt>
            <dd class="mt-1 font-arcade text-xs tabular-nums text-foreground">{{ creditAmount(balance.cashBalance) }}</dd>
          </div>
          <div class="clip-hud border border-violet/40 bg-void/50 p-2">
            <dt class="font-arcade text-[0.4375rem] uppercase tracking-[0.2em] text-muted-foreground">{{ en.wallet.bonus }}</dt>
            <dd class="mt-1 font-arcade text-xs tabular-nums text-ember">{{ creditAmount(balance.bonusBalance) }}</dd>
          </div>
        </dl>
        <p v-if="balance && balance.bonusBalance > 0" class="mt-2 flex items-center justify-center gap-1 text-sm text-foreground/85">
          <span>
            {{ en.wallet.wagering(creditAmount(balance.bonusWageringRemaining)) }}<template v-if="balance.bonusExpiresAtUtc"> · {{ en.wallet.expires(dateShort(balance.bonusExpiresAtUtc)) }}</template>
          </span>
          <InfoTip :text="en.wallet.bonusInfo" :label="en.wallet.bonus" align="right" />
        </p>

        <!-- Free credits only come from the spin wheel (its own page). -->
        <RouterLink
          to="/spin"
          class="clip-hud mt-7 block w-full border-2 border-violet/60 bg-void/60 p-4 transition-all hover:border-ember hover:[box-shadow:var(--glow-ember)]"
        >
          <span class="block font-arcade text-base text-ember">Spin the wheel</span>
          <span class="mt-1 block font-display text-xs uppercase tracking-[0.2em] text-foreground/80">
            Free credits<template v-if="spinStore.topPrize"> · up to {{ spinStore.topPrize.toLocaleString() }}</template><template v-if="spinStore.spinsLeftToday !== null"> · {{ en.spin.spinsLeft(spinStore.spinsLeftToday) }}</template>
          </span>
        </RouterLink>
        <div class="mt-2 flex justify-center"><SpinTimerChip /></div>

        <p v-if="walletStore.errorMessage" class="mt-2 font-arcade text-[0.5rem] uppercase tracking-[0.28em] text-danger">
          {{ walletStore.errorMessage }}
        </p>

        <RouterLink to="/game" class="mt-4 inline-block">
          <ArcadeButton size="lg">Back To The Sky</ArcadeButton>
        </RouterLink>
      </NeonPanel>

      <p class="mt-6 text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Free credits come from the wheel above.<template v-if="publicSettings.settings?.paymentsEnabled"> To buy more, use the panel below.</template>
      </p>

      <NeonPanel v-if="purchaseStatus" class="mt-6" :accent="purchaseStatus === 'success' ? 'lime' : 'ember'">
        <p v-if="purchaseStatus === 'success' && isAwaitingCredit" class="font-arcade text-[0.625rem] uppercase tracking-[0.2em] text-lime">
          Payment received — waiting for credits to land…
        </p>
        <p v-else-if="purchaseStatus === 'success' && wasCredited" class="font-arcade text-[0.625rem] uppercase tracking-[0.2em] text-lime">
          Purchase complete! Your balance is updated above.
        </p>
        <p v-else-if="purchaseStatus === 'success'" class="font-arcade text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          Payment is still processing — your credits will appear shortly. Refresh this page in a minute.
        </p>
        <p v-else class="font-arcade text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          Checkout was cancelled — no charge was made.
        </p>
      </NeonPanel>

      <!-- Only while an admin has payments switched on (the server refuses checkouts otherwise too). -->
      <BuyCreditsPanel v-if="publicSettings.settings?.paymentsEnabled" id="buy-credits" class="mt-6 scroll-mt-4 text-left" />

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
