<script setup lang="ts">
import { ref } from 'vue'
import { useAdminStore } from '@/stores/adminStore'
import { Coins, CircleAlert } from '@lucide/vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import '@/components/admin/admin.css'

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
  <div class="admin-console-modal" role="dialog" aria-modal="true" aria-labelledby="adjust-balance-title">
    <div class="adm-modal">
      <div class="adm-modal-header">
        <span class="adm-modal-icon" aria-hidden="true"><Coins /></span>
        <div class="min-w-0">
          <h2 id="adjust-balance-title" class="adm-modal-title">Adjust Balance — {{ username }}</h2>
          <p class="adm-modal-sub">Credit or debit this player's balance. Every adjustment is logged.</p>
        </div>
      </div>

      <div class="adm-modal-body">
        <label class="block">
          <span class="adm-label">Amount (negative to debit)</span>
          <input v-model.number="amount" type="number" step="0.01" class="adm-input adm-num w-full" />
        </label>
        <label class="block">
          <span class="adm-label">Reason</span>
          <input v-model="reason" type="text" maxlength="200" placeholder="e.g. Support refund #1234" class="adm-input w-full" />
        </label>

        <p v-if="error" class="adm-error"><CircleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />{{ error }}</p>
      </div>

      <div class="adm-modal-footer">
        <AdminButton variant="ghost" @click="emit('close')">Cancel</AdminButton>
        <AdminButton variant="primary" :disabled="isSubmitting" @click="submit">Confirm</AdminButton>
      </div>
    </div>
  </div>
</template>
