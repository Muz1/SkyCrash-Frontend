<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/playerStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useAuthStore } from '@/stores/AuthStore'
import { useLobbyStore } from '@/stores/lobbyStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { useChallengeStore } from '@/stores/challengeStore'
import { usePrivateLobbyStore } from '@/stores/privateLobbyStore'
import * as authService from '@/services/AuthService'
import Shell from '@/components/sky/Shell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ArcadeField from '@/components/sky/ArcadeField.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import AchievementBadge from '@/components/sky/AchievementBadge.vue'

const router = useRouter()
const playerStore = usePlayerStore()
const historyStore = useHistoryStore()
const authStore = useAuthStore()
const email = ref('')
const username = ref('')
const successMessage = ref('')
const errorMessage = ref('')
const isSaving = ref(false)

const usernameStatus = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
const usernameSuggestions = ref<string[]>([])
let usernameCheckTimer: ReturnType<typeof setTimeout> | undefined

onMounted(async () => {
  if (!playerStore.profile) {
    await playerStore.fetchProfile()
  }
  if (playerStore.profile) {
    email.value = playerStore.profile.email
    username.value = playerStore.profile.username
  }
  historyStore.fetchBets(1)
})

watch(
  () => playerStore.profile,
  (profile) => {
    if (profile) {
      email.value = profile.email
      username.value = profile.username
    }
  },
)

watch(username, (value) => {
  usernameSuggestions.value = []
  if (usernameCheckTimer) clearTimeout(usernameCheckTimer)

  const candidate = value.trim()
  if (candidate.length < 3 || candidate === playerStore.profile?.username) {
    usernameStatus.value = 'idle'
    return
  }

  usernameStatus.value = 'checking'
  usernameCheckTimer = setTimeout(async () => {
    try {
      const result = await authService.checkUsername(candidate)
      if (username.value.trim() !== candidate) return // stale response
      usernameStatus.value = result.available ? 'available' : 'taken'
      usernameSuggestions.value = result.suggestions
    } catch {
      usernameStatus.value = 'idle'
    }
  }, 400)
})

function applySuggestion(suggestion: string) {
  username.value = suggestion
}

function handleLogout() {
  authStore.logout()
  playerStore.clear()
  useLobbyStore().clear()
  useAchievementStore().clear()
  useChallengeStore().clear()
  usePrivateLobbyStore().clear()
  router.push('/login')
}

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
    const usernameChanged = username.value.trim() !== playerStore.profile?.username
    await playerStore.updateProfile({
      email: email.value,
      username: usernameChanged ? username.value.trim() : undefined,
    })
    successMessage.value = 'Profile updated.'
  } catch (err: unknown) {
    const response = (err as { response?: { data?: unknown } })?.response
    const data = response?.data
    if (Array.isArray(data)) {
      errorMessage.value = data.join(' ')
    } else if (data && typeof data === 'object' && 'message' in data) {
      const record = data as Record<string, unknown>
      errorMessage.value = String(record.message) || 'Update failed.'
      if (record.field === 'username' && Array.isArray(record.suggestions)) {
        usernameStatus.value = 'taken'
        usernameSuggestions.value = record.suggestions as string[]
      }
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
              <p class="flex items-center gap-2 truncate font-display text-xl font-black uppercase tracking-[0.18em] text-foreground">
                <AchievementBadge :achievement-key="playerStore.profile.displayedAchievementKey" size="md" />
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
            <div>
              <ArcadeField v-model="username" label="Username" required />
              <p v-if="usernameStatus === 'checking'" class="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Checking availability…
              </p>
              <p v-else-if="usernameStatus === 'available'" class="mt-1 text-[10px] uppercase tracking-[0.2em] text-lime">
                Available
              </p>
              <div v-else-if="usernameStatus === 'taken'" class="mt-1.5">
                <p class="text-[10px] uppercase tracking-[0.2em] text-danger">That username is already taken.</p>
                <div v-if="usernameSuggestions.length > 0" class="mt-1.5 flex flex-wrap gap-1.5">
                  <button
                    v-for="suggestion in usernameSuggestions"
                    :key="suggestion"
                    type="button"
                    class="clip-hud border border-electric/50 px-2 py-1 text-[10px] text-electric transition-all hover:[box-shadow:var(--glow-blue)]"
                    @click="applySuggestion(suggestion)"
                  >
                    {{ suggestion }}
                  </button>
                </div>
              </div>
            </div>
            <ArcadeField v-model="email" label="Email" type="email" required />

            <p v-if="successMessage" class="font-arcade text-[8px] uppercase tracking-[0.2em] text-lime">{{ successMessage }}</p>
            <p v-if="errorMessage" class="font-arcade text-[8px] uppercase tracking-[0.2em] text-danger">{{ errorMessage }}</p>

            <ArcadeButton type="submit" size="md" variant="blue" :disabled="isSaving">
              {{ isSaving ? 'Saving…' : 'Save changes' }}
            </ArcadeButton>
          </form>
        </NeonPanel>

        <NeonPanel class="mt-5" accent="lime">
          <RouterLink to="/missions">
            <ArcadeButton type="button" size="md" variant="blue" class="w-full">
              View Missions &amp; Achievements
            </ArcadeButton>
          </RouterLink>
        </NeonPanel>

        <NeonPanel class="mt-5" accent="ember">
          <ArcadeButton type="button" size="md" variant="danger" class="w-full" @click="handleLogout">
            Log Out
          </ArcadeButton>
        </NeonPanel>
      </template>

      <p v-else class="mt-6 text-center text-muted-foreground">Loading profile…</p>
    </div>
  </Shell>
</template>
