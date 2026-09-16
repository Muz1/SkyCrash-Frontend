<script setup lang="ts">
import { ref } from 'vue'
import { useAdminStore } from '@/stores/adminStore'
import ArcadeField from '@/components/sky/ArcadeField.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'

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
    const response = e && typeof e === 'object' && 'response' in e ? e.response : undefined
    const message =
      response &&
      typeof response === 'object' &&
      'data' in response &&
      response.data &&
      typeof response.data === 'object' &&
      'message' in response.data &&
      typeof response.data.message === 'string'
        ? response.data.message
        : undefined
    error.value = message ?? 'Adjustment failed.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm">
    <div class="neon-panel clip-hud w-full max-w-sm space-y-4 p-6">
      <h2 class="font-display text-sm font-black uppercase tracking-[0.2em] text-magenta text-glow-magenta">
        Adjust Balance — {{ username }}
      </h2>

      <ArcadeField v-model.number="amount" type="number" step="0.01" label="Amount (negative to debit)" />
      <ArcadeField v-model="reason" type="text" maxlength="200" label="Reason" />

      <p v-if="error" class="font-arcade text-[8px] uppercase tracking-[0.2em] text-danger">{{ error }}</p>

      <div class="flex justify-end gap-2">
        <ArcadeButton size="sm" variant="ghost" @click="emit('close')">Cancel</ArcadeButton>
        <ArcadeButton size="sm" variant="danger" :disabled="isSubmitting" @click="submit">Confirm</ArcadeButton>
      </div>
    </div>
  </div>
</template>
