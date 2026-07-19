<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/AuthStore'

const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await authStore.register({ username: username.value, email: email.value, password: password.value })
    router.push('/')
  } catch (err: unknown) {
    type AxiosLikeError = { response?: { data?: unknown } }
    const data = (err as AxiosLikeError).response?.data as unknown
    if (Array.isArray(data)) {
      errorMessage.value = data.join(' ')
    } else if (data && typeof data === 'object' && 'message' in (data as Record<string, unknown>)) {
      errorMessage.value = String((data as Record<string, unknown>).message)
    } else {
      errorMessage.value = 'Registration failed.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4">
    <form @submit.prevent="handleSubmit" class="w-full max-w-sm bg-slate-900 rounded-xl p-6 space-y-4">
      <h1 class="text-2xl font-bold">Create your SkyCrash account</h1>

      <div>
        <label class="block text-sm text-slate-400 mb-1">Username</label>
        <input v-model="username" type="text" required class="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <div>
        <label class="block text-sm text-slate-400 mb-1">Email</label>
        <input v-model="email" type="email" required class="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <div>
        <label class="block text-sm text-slate-400 mb-1">Password</label>
        <input v-model="password" type="password" required class="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>

      <button type="submit" :disabled="isSubmitting" class="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-2 font-medium transition">
        {{ isSubmitting ? 'Creating account…' : 'Register' }}
      </button>

      <p class="text-sm text-slate-400 text-center">
        Already have an account?
        <RouterLink to="/login" class="text-indigo-400 hover:underline">Log in</RouterLink>
      </p>
    </form>
  </div>
</template>