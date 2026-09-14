<script setup lang="ts">
import { ref } from 'vue'
import { useAdminStore } from '@/stores/adminStore'

const props = defineProps<{ playerId: string; username: string }>()
const emit = defineEmits<{ close: [] }>()

const adminStore = useAdminStore()
const amount = ref<number>(0)
const reason = ref('')
const error = ref('')
const isSubmitting = ref(false)

async function submit() {
  error.value = ''
  if (amount.value === 0) {
    error.value = 'Amount cannot be zero.'
    return
  }
  if (!reason.value.trim()) {
    error.value = 'A reason is required.'
    return
  }

  isSubmitting.value = true
  try {
    await adminStore.adjustBalance(props.playerId, amount.value, reason.value.trim())
    emit('close')
  } catch (e: unknown) {
    const response = e && typeof e === 'object' && 'response' in e
      ? e.response
      : undefined
    const message = response && typeof response === 'object' && 'data' in response
      && response.data && typeof response.data === 'object' && 'message' in response.data
      && typeof response.data.message === 'string'
      ? response.data.message
      : undefined
    error.value = message ?? 'Adjustment failed.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div class="bg-slate-900 rounded-xl p-6 w-full max-w-sm space-y-4">
      <h2 class="text-lg font-bold">Adjust balance — {{ username }}</h2>

      <div class="space-y-1">
        <label class="text-xs text-slate-400">Amount (use a negative number to debit)</label>
        <input v-model.number="amount" type="number" step="0.01" class="w-full bg-slate-800 rounded px-3 py-2" />
      </div>

      <div class="space-y-1">
        <label class="text-xs text-slate-400">Reason</label>
        <input v-model="reason" type="text" maxlength="200" class="w-full bg-slate-800 rounded px-3 py-2" />
      </div>

      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

      <div class="flex justify-end gap-2">
        <button class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700" @click="emit('close')">Cancel</button>
        <button
          class="px-3 py-1.5 rounded-lg bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50"
          :disabled="isSubmitting"
          @click="submit"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>
