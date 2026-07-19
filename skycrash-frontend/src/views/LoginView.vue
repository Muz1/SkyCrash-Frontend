<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/AuthStore'

const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await authStore.login({ username: username.value, password: password.value })
    router.push('/')
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response?: { data?: { message?: string } } }).response
      errorMessage.value = response?.data?.message ?? 'Login failed. Please try again.'
    } else {
      errorMessage.value = 'Login failed. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4">
    <form @submit.prevent="handleSubmit" class="w-full max-w-sm bg-slate-900 rounded-xl p-6 space-y-4">
      <h1 class="text-2xl font-bold">Log in to SkyCrash</h1>

      <div>
        <label class="block text-sm text-slate-400 mb-1">Username</label>
        <input
          v-model="username"
          type="text"
          required
          class="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label class="block text-sm text-slate-400 mb-1">Password</label>
        <input
          v-model="password"
          type="password"
          required
          class="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>

      <button
        type="submit"
        :disabled="isSubmitting"
        class="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-2 font-medium transition"
      >
        {{ isSubmitting ? 'Logging in…' : 'Log in' }}
      </button>

      <p class="text-sm text-slate-400 text-center">
        No account?
        <RouterLink to="/register" class="text-indigo-400 hover:underline">Register</RouterLink>
      </p>
    </form>
  </div>
</template>
