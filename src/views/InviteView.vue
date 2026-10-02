<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ShieldCheck } from '@lucide/vue'
import Shell from '@/components/sky/Shell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import { useAuthStore } from '@/stores/AuthStore'
import { usePlayerStore } from '@/stores/playerStore'
import { acceptInvitation, previewInvitation } from '@/services/adminAnalyticsService'
import type { InvitationPreview } from '@/types/insights'

// Where an admin invite link lands. Shows who invited whom, asks the person to sign in (or
// register) with the invited email, then accepts and opens the admin dashboard.
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const playerStore = usePlayerStore()

const token = computed(() => String(route.params.token ?? ''))
const invite = ref<InvitationPreview | null>(null)
const error = ref<string | null>(null)
const accepting = ref(false)

const signedInAsInvitee = computed(
  () => authStore.isAuthenticated && invite.value && authStore.email?.toLowerCase() === invite.value.email.toLowerCase(),
)

function messageOf(err: unknown, fallback: string) {
  return (axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined) ?? fallback
}

onMounted(async () => {
  try {
    invite.value = await previewInvitation(token.value)
  } catch (err) {
    error.value = messageOf(err, 'This invitation link isn’t valid.')
  }
})

async function accept() {
  accepting.value = true
  error.value = null
  try {
    await acceptInvitation(token.value)
    await playerStore.fetchProfile()
    router.push('/admin')
  } catch (err) {
    error.value = messageOf(err, 'The invitation could not be accepted.')
  } finally {
    accepting.value = false
  }
}

function switchAccount() {
  authStore.logout()
  playerStore.clear()
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}
</script>

<template>
  <Shell skin="deep-space" :dim="0.55">
    <div class="mx-auto w-full max-w-lg">
      <NeonPanel accent="magenta" title="Admin invitation">
        <div class="space-y-4 p-1 text-base leading-relaxed text-foreground">
          <p v-if="!invite && !error">Checking your invitation…</p>
          <template v-if="invite">
            <p class="flex items-center gap-2 font-display text-lg font-black uppercase tracking-[0.12em] text-magenta">
              <ShieldCheck class="h-5 w-5" aria-hidden="true" /> {{ invite.role }} access
            </p>
            <p>
              <strong>{{ invite.invitedBy }}</strong> invited <strong>{{ invite.name }}</strong> ({{ invite.email }}) to be
              {{ invite.role === 'Manager' ? 'a manager' : 'an admin' }} of the Sky Crash dashboard.
            </p>
            <p v-if="invite.status !== 'Pending'" class="border-2 border-danger bg-danger/15 px-3 py-2 font-semibold">
              This invitation is {{ invite.status.toLowerCase() }}. Ask a manager for a new one.
            </p>
            <template v-else>
              <p class="text-sm text-foreground/80">Note: admin accounts can’t play the game.</p>
              <div v-if="signedInAsInvitee" class="flex flex-col gap-3">
                <ArcadeButton size="lg" :disabled="accepting" @click="accept">{{ accepting ? 'Accepting…' : 'Accept invitation' }}</ArcadeButton>
              </div>
              <div v-else-if="authStore.isAuthenticated" class="flex flex-col gap-3">
                <p>You're signed in as {{ authStore.email }}. Sign in as {{ invite.email }} to accept.</p>
                <ArcadeButton variant="blue" @click="switchAccount">Switch account</ArcadeButton>
              </div>
              <div v-else class="flex flex-col gap-3 sm:flex-row">
                <RouterLink :to="{ name: 'login', query: { redirect: route.fullPath } }" class="flex-1">
                  <ArcadeButton class="w-full">Sign in</ArcadeButton>
                </RouterLink>
                <RouterLink v-if="!invite.accountExists" :to="{ name: 'register', query: { redirect: route.fullPath } }" class="flex-1">
                  <ArcadeButton variant="blue" class="w-full">Create account</ArcadeButton>
                </RouterLink>
              </div>
            </template>
          </template>
          <p v-if="error" role="alert" class="border-2 border-danger bg-danger/15 px-3 py-2 font-semibold">{{ error }}</p>
        </div>
      </NeonPanel>
    </div>
  </Shell>
</template>
