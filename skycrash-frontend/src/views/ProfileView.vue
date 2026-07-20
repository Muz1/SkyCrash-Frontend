<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { usePlayerStore } from '../stores/playerStore'

const playerStore = usePlayerStore()
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
})

watch(() => playerStore.profile, (profile) => {
  if (profile) email.value = profile.email
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
      const msg = String((data as Record<string, unknown>).message)
      errorMessage.value = msg || 'Update failed.'
    } else {
      errorMessage.value = 'Update failed.'
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 flex justify-center">
    <div class="w-full max-w-md space-y-6">
      <h1 class="text-2xl font-bold">Your profile</h1>

      <div v-if="playerStore.profile" class="bg-slate-900 rounded-xl p-6 space-y-4">
        <div>
          <span class="block text-sm text-slate-400">Username</span>
          <span class="text-slate-100">{{ playerStore.profile.username }}</span>
        </div>

        <div>
          <span class="block text-sm text-slate-400">Member since</span>
          <span class="text-slate-100">{{ new Date(playerStore.profile.memberSinceUtc).toLocaleDateString() }}</span>
        </div>

        <div>
          <span class="block text-sm text-slate-400">Credit balance</span>
          <span class="text-slate-100">{{ playerStore.profile.creditBalance }}</span>
        </div>

        <form @submit.prevent="handleSave" class="space-y-3 pt-2 border-t border-slate-800">
          <label class="block text-sm text-slate-400 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <p v-if="successMessage" class="text-sm text-emerald-400">{{ successMessage }}</p>
          <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>

          <button
            type="submit"
            :disabled="isSaving"
            class="rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 font-medium transition"
          >
            {{ isSaving ? 'Saving…' : 'Save changes' }}
          </button>
        </form>
      </div>

      <p v-else class="text-slate-400">Loading profile…</p>
    </div>
  </div>
</template>