<script setup lang="ts">
import { ref } from 'vue'
import { useAdminSettingsStore } from '@/stores/adminSettingsStore'
import { KeyRound, CircleAlert } from '@lucide/vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import '@/components/admin/admin.css'

const props = defineProps<{ newHouseEdgePercentage: number }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const adminSettingsStore = useAdminSettingsStore()
const password = ref('')
const error = ref('')
const isSubmitting = ref(false)

async function submit() {
  error.value = ''
  if (!password.value) {
    error.value = 'Enter your password to confirm this change.'
    return
  }

  isSubmitting.value = true
  try {
    await adminSettingsStore.updateHouseEdge(props.newHouseEdgePercentage, password.value)
    emit('saved')
  } catch (e: unknown) {
    const response = e && typeof e === 'object' && 'response' in e ? (e as { response?: { data?: unknown } }).response : undefined
    const data = response?.data as Record<string, unknown> | undefined
    error.value = (data && typeof data.message === 'string' && data.message) || 'Incorrect password.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="admin-console-modal" role="dialog" aria-modal="true" aria-labelledby="house-edge-title">
    <div class="adm-modal" style="--adm-modal-tone: var(--neon-orange)">
      <div class="adm-modal-header">
        <span class="adm-modal-icon" aria-hidden="true"><KeyRound /></span>
        <div class="min-w-0">
          <h2 id="house-edge-title" class="adm-modal-title">Confirm House Edge Change</h2>
          <p class="adm-modal-sub">This is a sensitive, audited setting.</p>
        </div>
      </div>

      <div class="adm-modal-body">
        <p class="adm-callout">
          <span>
            You're about to set the house edge to
            <strong class="adm-num text-[var(--neon-orange)]">{{ newHouseEdgePercentage }}%</strong>. Re-enter your password
            to confirm this affects real payouts for every player going forward.
          </span>
        </p>

        <label class="block">
          <span class="adm-label">Your Password</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="adm-input w-full"
            @keyup.enter="submit"
          />
        </label>

        <p v-if="error" class="adm-error"><CircleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />{{ error }}</p>
      </div>

      <div class="adm-modal-footer">
        <AdminButton variant="ghost" @click="emit('close')">Cancel</AdminButton>
        <AdminButton variant="danger-solid" :disabled="isSubmitting" @click="submit">
          {{ isSubmitting ? 'Confirming…' : 'Confirm Change' }}
        </AdminButton>
      </div>
    </div>
  </div>
</template>
