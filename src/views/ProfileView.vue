<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useHistoryStore } from '@/stores/historyStore'
import Shell from '@/components/sky/Shell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ArcadeField from '@/components/sky/ArcadeField.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'

const playerStore = usePlayerStore()
const historyStore = useHistoryStore()
const email = ref('')
const successMessage = ref('')
const errorMessage = ref('')
const isSaving = ref(false)

onMounted(async () => {
  if (!playerStore.profile) {
    await playerStore.fetchProfile()
  }
  if (playerStore.profile) {
    email.value = playerStore.profile.email
  }
  historyStore.fetchBets(1)
})

watch(
  () => playerStore.profile,
  (profile) => {
    if (profile) email.value = profile.email
  },
)

const stats = computed(() => {
  const bets = historyStore.bets
  const cashedOut = bets.filter((b) => b.status === 'CashedOut')
  const best = cashedOut.reduce((m, b) => Math.max(m, b.cashOutMultiplier ?? 0), 0)
  const biggest = cashedOut.reduce((m, b) => Math.max(m, b.payout ?? 0), 0)
  return [
    { label: 'Total Flights', value: bets.length.toString() },
    { label: 'Win Rate', value: `${Math.round((cashedOut.length / Math.max(bets.length, 1)) * 100)}%` },
    { label: 'Highest Multiplier', value: `${best.toFixed(2)}x` },
    { label: 'Biggest Cash-Out', value: biggest.toLocaleString() },
  ]
})

async function handleSave() {
  successMessage.value = ''
  errorMessage.value = ''
  isSaving.value = true
  try {
    await playerStore.updateProfile({ email: email.value })
    successMessage.value = 'Profile updated.'
  } catch (err: unknown) {
    const response = (err as { response?: { data?: unknown } })?.response
    const data = response?.data
    if (Array.isArray(data)) {
      errorMessage.value = data.join(' ')
    } else if (data && typeof data === 'object' && 'message' in data) {
      errorMessage.value = String((data as Record<string, unknown>).message) || 'Update failed.'
    } else {
      errorMessage.value = 'Update failed.'
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Shell skin="deep-space" :dim="0.5">
    <div class="mx-auto w-full max-w-3xl">
      <h1 class="text-center font-display text-2xl font-black uppercase tracking-[0.2em] text-magenta text-glow-magenta sm:text-3xl">
        Pilot Profile
      </h1>

      <template v-if="playerStore.profile">
        <NeonPanel class="mt-6" accent="magenta">
          <div class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
            <div class="grid h-16 w-16 shrink-0 place-items-center border-2 border-electric bg-void/70 clip-hud font-arcade text-lg text-electric text-glow-blue">
              {{ playerStore.profile.username.slice(0, 2).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="truncate font-display text-xl font-black uppercase tracking-[0.18em] text-foreground">
                {{ playerStore.profile.username }}
              </p>
              <p class="font-arcade text-[8px] uppercase tracking-[0.3em] text-ember">
                Pilot since {{ new Date(playerStore.profile.memberSinceUtc).toLocaleDateString() }}
              </p>
            </div>
          </div>

          <dl class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div v-for="s in stats" :key="s.label" class="clip-hud border border-violet/40 bg-void/50 p-3">
              <dt class="font-arcade text-[7px] uppercase tracking-[0.24em] text-muted-foreground">{{ s.label }}</dt>
              <dd class="mt-1 font-arcade text-sm text-electric text-glow-blue">{{ s.value }}</dd>
            </div>
          </dl>
        </NeonPanel>

        <NeonPanel class="mt-5" title="Account" accent="blue">
          <form class="space-y-4" @submit.prevent="handleSave">
            <ArcadeField v-model="email" label="Email" type="email" required />

            <p v-if="successMessage" class="font-arcade text-[8px] uppercase tracking-[0.2em] text-lime">{{ successMessage }}</p>
            <p v-if="errorMessage" class="font-arcade text-[8px] uppercase tracking-[0.2em] text-danger">{{ errorMessage }}</p>

            <ArcadeButton type="submit" size="md" variant="blue" :disabled="isSaving">
              {{ isSaving ? 'Saving…' : 'Save changes' }}
            </ArcadeButton>
          </form>
        </NeonPanel>
      </template>

      <p v-else class="mt-6 text-center text-muted-foreground">Loading profile…</p>
    </div>
  </Shell>
</template>
